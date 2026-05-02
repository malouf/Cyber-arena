# Règles de l'Agent (Agent Rules)

Ces règles sont établies pour garantir la stabilité du développement et une meilleure collaboration avec l'utilisateur.

## 1. Stabilité de la Sandbox (Anti-Crash)
- **Vérification régulière** : Si des erreurs étranges surviennent, toujours vérifier l'état des terminaux (`vite`, `convex`) via `bash action="status"`.
- **Restauration** : Si `npm` ou `npx` est introuvable après un redémarrage de la sandbox, toujours lancer `source /etc/profile.d/cto-env-vars.sh` avant de redémarrer les serveurs de dev.
- **Sauvegarde** : Conserver l'état de la réflexion dans des fichiers (comme `GAMEPLAY_PLAN.md`) pour ne pas perdre le contexte en cas de redémarrage.

## 2. Communication et Validation
- **Poser des questions** : En cas de doute, d'ambiguïté dans la demande, ou s'il y a un choix de conception important à faire, **poser la question à l'utilisateur** au lieu de deviner.
- **Points de blocage** : Si une erreur technique persiste ou nécessite un compromis lourd, l'expliquer clairement à l'utilisateur et proposer 2 ou 3 options.
- **Idées proactives** : Si une idée d'amélioration (gameplay, design, architecture) émerge, la suggérer à l'utilisateur pour obtenir son feu vert avant de tout coder.

## 3. Démarche Incrémentale
- Ne jamais essayer de coder un système massif en une seule fois.
- Coder un élément fonctionnel, le montrer, et demander : "Est-ce que ça te plaît ? On passe à l'étape suivante ?"
