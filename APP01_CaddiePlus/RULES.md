# BackEnd Firebase

- Mon BackEnd Firebase est rattaché à plusieurs de mes applications qui sont indépendantes (1 même back-end pour plusieurs applications). Afin de bien séparés les objets utilisés par mes différentes applications, je préfixe mes objets dans Firebase.

  - Voir la variable 'APP_PREFIX' dans 'firebase/config.ts'
  - Cette variable doit être utilisé systématiquement dans les noms de mes collections, documents, etc.
  - Seule la partie Authentification n'est pas préfixée et est commune à toutes les applications.

- Tout appel de firebase/firestore.ts doit respecter cete manière de procéder : l'utilisation du constante en tête de fichier.
  - La variable collectionName de firebase/firestore.ts doit être définie par une constante dans le fichier qui l'appel.
    - const COLLECTION_NAME = "MesAppsFirebase";

## 🚀 Style de l'application

- Il faut veiller à conserver un style cohérent dans toute l'application entre les différentes pages.
