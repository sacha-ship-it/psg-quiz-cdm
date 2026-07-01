const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js')
const questions = require('./questions')

const TOKEN = process.env.TOKEN
const CHANNEL_ID = process.env.QUIZ_CHANNEL_ID
const CLIENT_ID = process.env.CLIENT_ID
const SCORES_CHANNEL_ID = process.env.SCORES_CHANNEL_ID

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
})

let quizRunning = false
const hasParticipated = new Set()
let globalScores = {}
let scoresMessageId = null

async function loadScoresFromDiscord() {
  try {
    const channel = await client.channels.fetch(SCORES_CHANNEL_ID)
    const messages = await channel.messages.fetch({ limit: 10 })
    const scoresMsg = messages.find(m => m.author.id === client.user.id && m.content.startsWith('SCORES:'))
    if (scoresMsg) {
      globalScores = JSON.parse(scoresMsg.content.replace('SCORES:', ''))
      scoresMessageId = scoresMsg.id
      console.log('Scores chargés depuis Discord')
    }
  } catch (e) {
    console.log('Pas de scores existants:', e.message)
  }
}

async function saveScoresToDiscord() {
  try {
    const channel = await client.channels.fetch(SCORES_CHANNEL_ID)
    const content = 'SCORES:' + JSON.stringify(globalScores)
    if (scoresMessageId) {
      const msg = await channel.messages.fetch(scoresMessageId)
      await msg.edit(content)
    } else {
      const msg = await channel.send(content)
      scoresMessageId = msg.id
    }
  } catch (e) {
    console.error('Erreur sauvegarde scores:', e.message)
  }
}

async function sendQuestionsToParticipant(interaction) {
  const userId = interaction.user.id
  const username = interaction.user.username

  if (!globalScores[userId]) {
    globalScores[userId] = { username, score: 0, correct: 0, wrong: 0, quizzesPlayed: 0 }
  }

  let quizScore = 0
  let quizCorrect = 0
  let quizWrong = 0

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`q${i}_A_${userId}`).setLabel('A').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`q${i}_B_${userId}`).setLabel('B').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`q${i}_C_${userId}`).setLabel('C').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`q${i}_D_${userId}`).setLabel('D').setStyle(ButtonStyle.Primary),
    )

    await interaction.followUp({
      embeds: [new EmbedBuilder()
        .setTitle(`⚽ Question ${i + 1} / ${questions.length}`)
        .setDescription(q.question + '\n\n' + q.choices.join('\n'))
        .setColor('#DA291C')
        .setFooter({ text: '⏱️ 10 secondes pour répondre !' })],
      components: [row],
      ephemeral: true
    })

    const startTime = Date.now()
    let answerFeedback = ''

    await new Promise(resolve => {
      const filter = i2 => i2.customId.endsWith(`_${userId}`) && i2.user.id === userId
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 10000, max: 1 })

      collector.on('collect', async i2 => {
        const choice = i2.customId.split('_')[1]
        const speed = Math.max(0, Math.round((10000 - (Date.now() - startTime)) / 1000))

        if (choice === q.answer) {
          const pts = 10 + speed
          quizScore += pts
          quizCorrect += 1
          answerFeedback = `✅ Bonne réponse ! +${pts} pts (dont +${speed} pts rapidité)`
        } else {
          quizWrong += 1
          answerFeedback = `❌ Mauvaise réponse ! La bonne réponse était ${q.answer}: ${q.choices.find(c => c.startsWith(q.answer))}`
        }

        await i2.deferUpdate()
        collector.stop()
      })

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          answerFeedback = `⏱️ Temps écoulé ! La bonne réponse était ${q.answer}: ${q.choices.find(c => c.startsWith(q.answer))}`
          quizWrong += 1
        }

        await interaction.followUp({ content: answerFeedback, ephemeral: true })
        setTimeout(resolve, 2000)
      })
    })
  }

  globalScores[userId].score += quizScore
  globalScores[userId].correct += quizCorrect
  globalScores[userId].wrong += quizWrong
  globalScores[userId].quizzesPlayed += 1
  globalScores[userId].username = username
  await saveScoresToDiscord()

  await interaction.followUp({
    embeds: [new EmbedBuilder()
      .setTitle('🏁 Quiz terminé !')
      .setDescription(`Score de ce quiz : ${quizScore} pts\n✅ Bonnes réponses : ${quizCorrect}\n❌ Mauvaises réponses : ${quizWrong}\n\nReviens demain pour un nouveau quiz !`)
      .setColor('#004170')],
    ephemeral: true
  })
}

async function startQuiz(commandInteraction) {
  if (quizRunning) {
    await commandInteraction.reply({ content: '⚠️ Un quiz est déjà en cours ! Utilise /endquiz pour le terminer.', ephemeral: true })
    return
  }

  if (questions.length === 0) {
    await commandInteraction.reply({ content: '❌ Pas de questions configurées pour aujourd\'hui.', ephemeral: true })
    return
  }

  quizRunning = true
  hasParticipated.clear()

  const channel = await client.channels.fetch(CHANNEL_ID)

  const startRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('start_quiz')
      .setLabel('⚽ Commencer le quiz du jour')
      .setStyle(ButtonStyle.Success)
  )

  await channel.send({
    embeds: [new EmbedBuilder()
      .setTitle('🔴🔵 QUIZ DU JOUR : CDM DES PARISIENS')
      .setDescription('Le quiz du jour est disponible !\n\n🔒 Les questions sont privées, personne ne voit tes réponses.\n\nClique sur le bouton ci-dessous pour commencer 👇\n\n⏱️ Tu as 10 secondes par question.')
      .setColor('#DA291C')
      .setFooter({ text: '🔴🔵 CDM des Parisiens, un nouveau quiz chaque jour' })],
    components: [startRow]
  })

  await commandInteraction.reply({ content: '✅ Le quiz du jour a été lancé dans le canal dédié !', ephemeral: true })

  const filter = i => i.customId === 'start_quiz'
  const collector = channel.createMessageComponentCollector({ filter, time: 86400000 })

  collector.on('collect', async interaction => {
    const userId = interaction.user.id

    if (hasParticipated.has(userId)) {
      return interaction.reply({ content: '❌ Tu as déjà participé au quiz d\'aujourd\'hui ! Reviens demain.', ephemeral: true })
    }

    hasParticipated.add(userId)
    await interaction.reply({ content: '🚀 Le quiz commence ! Les questions arrivent...', ephemeral: true })
    sendQuestionsToParticipant(interaction)
  })

  collector.on('end', async () => {
    quizRunning = false
  })
}

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('quiz')
      .setDescription('Lance le quiz du jour')
      .toJSON(),
    new SlashCommandBuilder()
      .setName('classement')
      .setDescription('Affiche le classement général cumulé')
      .toJSON(),
    new SlashCommandBuilder()
      .setName('endquiz')
      .setDescription('Termine le quiz en cours')
      .toJSON()
  ]

  const rest = new REST({ version: '10' }).setToken(TOKEN)
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] })
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })
  console.log('Commandes /quiz, /classement et /endquiz enregistrées')
}

client.on('ready', async () => {
  console.log(`Bot connecté : ${client.user.tag}`)
  await registerCommands()
  await loadScoresFromDiscord()
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return

  if (interaction.commandName === 'quiz') {
    startQuiz(interaction)
  }

  if (interaction.commandName === 'classement') {
    const top = Object.entries(globalScores)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 10)

    const medals = ['🥇', '🥈', '🥉']
    const classement = top.length
      ? top.map(([id, data], i) => {
          const rank = medals[i] || (i + 1) + '.'
          return rank + ' ' + data.username + ' : ' + data.score + ' pts (' + data.quizzesPlayed + ' quiz joués)'
        }).join('\n')
      : 'Aucun participant pour le moment.'

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('🏆 CLASSEMENT GENERAL CDM DES PARISIENS')
        .setDescription(classement)
        .setColor('#DA291C')],
      ephemeral: false
    })
  }

  if (interaction.commandName === 'endquiz') {
    if (quizRunning) {
      quizRunning = false
      hasParticipated.clear()
      await interaction.reply({ content: '✅ Le quiz a été terminé manuellement. Tu peux en relancer un nouveau avec /quiz.', ephemeral: true })
    } else {
      await interaction.reply({ content: '⚠️ Aucun quiz en cours.', ephemeral: true })
    }
  }
})

client.login(TOKEN)
