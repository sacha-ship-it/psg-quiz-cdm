const today = new Date().toISOString().slice(0, 10) // Format: YYYY-MM-DD

const allQuestions = {
  "2026-06-29": [
    {
      question: "Quel joueur du PSG représente le Brésil au Mondial ?",
      choices: ["A - Mbappé", "B - Vitinha", "C - Marquinhos", "D - Dembélé"],
      answer: "C"
    },
    {
      question: "Combien de buts Vinícius a-t-il marqués lors du 1er match du Brésil ?",
      choices: ["A - 0", "B - 1", "C - 2", "D - 3"],
      answer: "B"
    },
    {
      question: "Quelle nation PSG a remporté son premier match du Mondial ?",
      choices: ["A - France", "B - Espagne", "C - Brésil", "D - Portugal"],
      answer: "C"
    },
    {
      question: "Quel Parisien a été élu homme du match lors du premier match de l'Espagne ?",
      choices: ["A - Hakimi", "B - Dembélé", "C - Vitinha", "D - Yamal"],
      answer: "B"
    },
    {
      question: "Combien de nations PSG participent à la CDM des Parisiens ?",
      choices: ["A - 4", "B - 6", "C - 8", "D - 10"],
      answer: "C"
    },
    {
      question: "Quel joueur PSG représente le Maroc ?",
      choices: ["A - Hakimi", "B - Fabian Ruiz", "C - Nuno Mendes", "D - Marquinhos"],
      answer: "A"
    },
    {
      question: "Quel format de score rapporte le plus de points dans les pronos CDM ?",
      choices: ["A - Bonne équipe gagnante", "B - Score exact", "C - Nombre de buts", "D - Buteur décisif"],
      answer: "B"
    },
    {
      question: "Quel canal utiliser pour poser tes pronos sur le serveur PSG ?",
      choices: ["A - #général", "B - #pronomondial", "C - #résultats", "D - #classement"],
      answer: "B"
    },
    {
      question: "Combien de points rapporte un bon résultat dans les pronos CDM ?",
      choices: ["A - 3 pts", "B - 5 pts", "C - 10 pts", "D - 15 pts"],
      answer: "B"
    },
    {
      question: "Quel joueur PSG représente la Corée du Sud ?",
      choices: ["A - Lee Kang-in", "B - Hwang Hee-chan", "C - Son Heung-min", "D - Kim Min-jae"],
      answer: "A"
    }
  ],
  "2026-06-30": [
    {
      question: "Question du 30 juin — Complète avec tes propres questions !",
      choices: ["A - Choix 1", "B - Choix 2", "C - Choix 3", "D - Choix 4"],
      answer: "A"
    }
    // Ajoute tes 10 questions ici
  ]
}

module.exports = allQuestions[today] || []
