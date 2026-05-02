import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useMutation } from 'convex/react'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

type RawAction = {
  type: 'move' | 'basic_attack'
  target: { x: number; y: number }
}

export const Route = createFileRoute('/multiplayer')({
  component: MultiplayerPage,
})

function MultiplayerPage() {
  const [clientId, setClientId] = useState<string | null>(null)

  useEffect(() => {
    const storageKey = 'arena_async_client_id'
    const existingId = window.localStorage.getItem(storageKey)
    if (existingId) {
      setClientId(existingId)
      return
    }

    const generatedId =
      typeof window.crypto?.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `client-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
    window.localStorage.setItem(storageKey, generatedId)
    setClientId(generatedId)
  }, [])

  if (!clientId) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-neutral-400 uppercase tracking-[0.2em] text-xs">Initializing client...</p>
      </main>
    )
  }

  return <MultiplayerClient clientId={clientId} />
}

function MultiplayerClient({ clientId }: { clientId: string }) {
  const queueForMatch = useMutation(api.matches.queueForMatch)
  const leaveQueue = useMutation(api.matches.leaveQueue)

  const [displayName, setDisplayName] = useState('')
  const [isQueueing, setIsQueueing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const existing = window.localStorage.getItem('arena_async_display_name')
    if (existing) {
      setDisplayName(existing)
      return
    }
    setDisplayName(`Pilot-${clientId.slice(0, 4)}`)
  }, [clientId])

  const { data: lobbyState } = useSuspenseQuery(
    convexQuery(api.matches.getLobbyState, { clientId }),
  )

  const normalizedName = useMemo(() => {
    const trimmed = displayName.trim()
    return trimmed.length === 0 ? `Pilot-${clientId.slice(0, 4)}` : trimmed
  }, [displayName, clientId])

  const handleQueue = async () => {
    setErrorMessage(null)
    setIsQueueing(true)
    try {
      window.localStorage.setItem('arena_async_display_name', normalizedName)
      await queueForMatch({ clientId, displayName: normalizedName })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to queue.')
    } finally {
      setIsQueueing(false)
    }
  }

  const handleLeaveQueue = async () => {
    setErrorMessage(null)
    setIsQueueing(true)
    try {
      await leaveQueue({ clientId })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to leave queue.')
    } finally {
      setIsQueueing(false)
    }
  }

  if (lobbyState.matchId) {
    return (
      <MatchRoom
        clientId={clientId}
        matchId={lobbyState.matchId}
        onQueueAgain={handleQueue}
      />
    )
  }

  return (
    <main className="min-h-screen bg-black text-neutral-100 font-sans p-6 md:p-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="flex items-center justify-between border-b border-neutral-900 pb-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">
              Multiplayer<span className="text-red-600">.</span>Slice
            </h1>
            <p className="text-xs text-neutral-500 uppercase tracking-[0.2em] mt-1">
              Server-authoritative turn resolution
            </p>
          </div>
          <Link to="/" className="text-xs uppercase tracking-widest text-neutral-500 hover:text-white">
            ← Back
          </Link>
        </header>

        <section className="border border-neutral-900 bg-neutral-950 p-6 space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
              Callsign
            </label>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full bg-black border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-red-600"
              maxLength={24}
            />
          </div>

          <div className="text-xs text-neutral-500 font-mono">
            Client ID: {clientId}
          </div>

          {lobbyState.waiting ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-red-500">
                Waiting for an opponent...
              </p>
              <button
                onClick={handleLeaveQueue}
                disabled={isQueueing}
                className="w-full border border-neutral-700 py-3 text-xs uppercase tracking-[0.2em] hover:border-white disabled:opacity-50"
              >
                Leave Queue
              </button>
            </div>
          ) : (
            <button
              onClick={handleQueue}
              disabled={isQueueing}
              className="w-full bg-white text-black py-3 text-xs font-black uppercase tracking-[0.25em] hover:bg-red-600 hover:text-white disabled:opacity-50"
            >
              {isQueueing ? 'Connecting...' : 'Find Match'}
            </button>
          )}

          {errorMessage && (
            <p className="text-xs text-red-500 border border-red-800/70 bg-red-950/30 p-3">{errorMessage}</p>
          )}
        </section>
      </div>
    </main>
  )
}

function MatchRoom({
  clientId,
  matchId,
  onQueueAgain,
}: {
  clientId: string
  matchId: Id<'matches'>
  onQueueAgain: () => Promise<void>
}) {
  const submitTurn = useMutation(api.matches.submitTurn)

  const [selectedCommand, setSelectedCommand] = useState<'move' | 'basic_attack' | null>(null)
  const [queue, setQueue] = useState<Array<RawAction>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: match } = useSuspenseQuery(
    convexQuery(api.matches.getMatchState, { matchId, clientId }),
  )

  useEffect(() => {
    setQueue([])
    setSelectedCommand(null)
    setSubmitError(null)
  }, [match.turnNumber])

  const handleCellClick = (x: number, y: number) => {
    if (!selectedCommand) return
    if (!match.canSubmit || match.status !== 'active') return
    if (queue.length >= 6) return

    setQueue((previous) => [...previous, { type: selectedCommand, target: { x, y } }])
  }

  const handleSubmit = async () => {
    if (queue.length === 0) return
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await submitTurn({
        matchId,
        clientId,
        turnNumber: match.turnNumber,
        queue,
      })
      setQueue([])
      setSelectedCommand(null)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Turn submission failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const boardRows = Array.from({ length: 10 }, (_, y) => y)
  const boardCols = Array.from({ length: 10 }, (_, x) => x)

  return (
    <main className="min-h-screen bg-black text-neutral-100 font-sans p-4 md:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <header className="border-b border-neutral-900 pb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">
              Match #{match.matchId.slice(-6)}
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mt-1">
              Turn {match.turnNumber} • {match.phase.replaceAll('_', ' ')} • You are {match.yourSlot}
            </p>
          </div>
          <Link to="/" className="text-xs uppercase tracking-widest text-neutral-500 hover:text-white">
            ← Exit
          </Link>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
          <section className="border border-neutral-900 bg-neutral-950 p-4 overflow-auto">
            <div className="grid gap-1 min-w-[520px]">
              {boardRows.map((y) => (
                <div key={y} className="grid grid-cols-10 gap-1">
                  {boardCols.map((x) => {
                    const isPlayer = match.playerState.pos.x === x && match.playerState.pos.y === y
                    const isEnemy = match.enemyState.pos.x === x && match.enemyState.pos.y === y
                    return (
                      <button
                        key={`${x}-${y}`}
                        onClick={() => handleCellClick(x, y)}
                        className={`aspect-square border text-[9px] font-mono transition-colors ${
                          isPlayer
                            ? 'border-white bg-white text-black font-bold'
                            : isEnemy
                              ? 'border-red-600 bg-red-600/20 text-red-400'
                              : 'border-neutral-800 bg-black hover:border-neutral-500'
                        }`}
                      >
                        {isPlayer ? 'YOU' : isEnemy ? 'EN' : `${x},${y}`}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="border border-neutral-900 bg-neutral-950 p-4 space-y-3">
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Server State</h2>
              <div className="text-xs font-mono space-y-2">
                <p>
                  You: HP {match.playerState.hp}/{match.playerState.maxHp} • PA {match.playerState.pa} • PM {match.playerState.pm}
                </p>
                <p>
                  Enemy: HP {match.enemyState.hp}/{match.enemyState.maxHp} • PA {match.enemyState.pa} • PM {match.enemyState.pm}
                </p>
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                P1 submitted: {match.player1Submitted ? 'yes' : 'no'} • P2 submitted: {match.player2Submitted ? 'yes' : 'no'}
              </div>
            </section>

            <section className="border border-neutral-900 bg-neutral-950 p-4 space-y-3">
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Build Queue</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedCommand('move')}
                  disabled={!match.canSubmit || match.status !== 'active'}
                  className={`py-2 border text-xs uppercase tracking-widest ${
                    selectedCommand === 'move'
                      ? 'border-white bg-white text-black'
                      : 'border-neutral-700 hover:border-white'
                  } disabled:opacity-40`}
                >
                  Move
                </button>
                <button
                  onClick={() => setSelectedCommand('basic_attack')}
                  disabled={!match.canSubmit || match.status !== 'active'}
                  className={`py-2 border text-xs uppercase tracking-widest ${
                    selectedCommand === 'basic_attack'
                      ? 'border-red-600 bg-red-600/20 text-red-300'
                      : 'border-neutral-700 hover:border-red-500'
                  } disabled:opacity-40`}
                >
                  Basic Attack
                </button>
              </div>
              <div className="space-y-2 max-h-32 overflow-auto pr-1">
                {queue.length === 0 ? (
                  <p className="text-[11px] text-neutral-600">No queued commands.</p>
                ) : (
                  queue.map((action, index) => (
                    <div key={index} className="text-[11px] font-mono border border-neutral-800 p-2">
                      {index + 1}. {action.type.toUpperCase()} → [{action.target.x},{action.target.y}]
                    </div>
                  ))
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setQueue([])}
                  disabled={queue.length === 0 || !match.canSubmit}
                  className="border border-neutral-800 py-2 text-[10px] uppercase tracking-widest hover:border-white disabled:opacity-40"
                >
                  Clear
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={queue.length === 0 || !match.canSubmit || isSubmitting || match.status !== 'active'}
                  className="bg-white text-black py-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white disabled:opacity-40"
                >
                  {isSubmitting ? 'Submitting...' : 'Commit'}
                </button>
              </div>
              {submitError && <p className="text-xs text-red-500">{submitError}</p>}
              {!match.canSubmit && match.status === 'active' && (
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  Waiting for next turn...
                </p>
              )}
            </section>

            <section className="border border-neutral-900 bg-neutral-950 p-4">
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Latest Server Events</h2>
              <div className="space-y-1 max-h-56 overflow-auto pr-1 text-[11px] font-mono text-neutral-300">
                {match.latestEvents.length === 0 ? (
                  <p className="text-neutral-600">No resolved turn yet.</p>
                ) : (
                  match.latestEvents.map((event, index) => {
                    if (event.type === 'log') {
                      return <p key={index}>• {event.text}</p>
                    }
                    if (event.type === 'move') {
                      return (
                        <p key={index}>
                          • {event.entity} moved to [{event.pos.x},{event.pos.y}]
                        </p>
                      )
                    }
                    if (event.type === 'attack') {
                      return (
                        <p key={index}>
                          • {event.entity} attacked [{event.target.x},{event.target.y}] →{' '}
                          {event.hit ? `HIT ${event.damage}` : 'MISS'}
                        </p>
                      )
                    }
                    return (
                      <p key={index}>
                        • {event.entity} stats: HP {event.hp}, PA {event.pa}, PM {event.pm}, M {event.mana}
                      </p>
                    )
                  })
                )}
              </div>
            </section>
          </aside>
        </div>

        {match.status === 'completed' && (
          <section className="border border-red-900 bg-red-950/30 p-4 text-center space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-red-500">Match Completed</p>
            <p className="text-xs text-neutral-300">Winner: {match.winner ?? 'none'}</p>
            <button
              onClick={onQueueAgain}
              className="mt-2 border border-neutral-700 px-4 py-2 text-xs uppercase tracking-widest hover:border-white"
            >
              Queue Again
            </button>
          </section>
        )}
      </div>
    </main>
  )
}
