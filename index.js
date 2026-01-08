require('dotenv').config();
const { Client, GatewayIntentBits, Events, Partials } = require('discord.js');
// Helper functions
const { isWithinWorkingHours, sleep } = require('./helperFunctions/isWithinWorkingHours');
const { parseWorkMessage } = require('./helperFunctions/parseWorkMessage');
const { updateExcelFile, zipDailyReports } = require('./helperFunctions/updateExcelFile');
const cron = require('node-cron');
const logger = require("./winston/winstonSetup");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages
  ],
    partials: [Partials.Channel] // To receive DMs
});

// config variables

const {
  DISCORD_TOKEN,
  INTERVAL_MS,
  GUILD_ID,
  ROLE_ID,
  DM_DELAY_MS,
  REPORT_USER_ID
} = process.env;

let guild; // keep reference

client.once(Events.ClientReady, async () => {
  logger.info(`🤖 Logged in as ${client.user.tag}`);

  // Use cache instead of fetching guild (avoids partials issues)
  guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    logger.error(`❌ Guild with ID ${GUILD_ID} not found in cache`);
    return;
  }

  try {
    // Fetch all members from Discord (ensure full cache)
    await guild.members.fetch({ force: true });
    logger.info(`✅ All members fetched for guild ${guild.name}`);
  } catch (err) {
    logger.error('❌ Error fetching all members:', err);
  }

  setInterval(runScheduledDMs, Number(INTERVAL_MS));
});

async function runScheduledDMs() {
  if (!isWithinWorkingHours()) {
    logger.info('Outside working hours. Skipping DM send.');
    return;
  }

  logger.info('📧 Sending scheduled DMs...');

  const role = await guild.roles.fetch(ROLE_ID);
  if (!role) return logger.error('❌ Role not found');

  for (const member of role.members.values()) {
    if (member.user.bot) continue;

    try {
      await member.send(
        `Hej ${member.displayName}!
Pamiętaj o wpisaniu godzin do Raportu!
Możesz to zrobić odpowiadając mi na tym czatcie!
Format wiadomości: 
Nazwa Zadania* / Klient lub Projekt* / Czas* / KM / Nr. Rejestracji
*pola wymagane`
      );

      logger.info(`📧 DM sent to ${member.user.tag}`);
    } catch (err) {
      logger.error(`❌ Failed to DM ${member.user.tag}:`, err.message);
    }

    // throttle to avoid rate limits
    await sleep(Number(DM_DELAY_MS));
  }
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.guild)    return; // Only process DMs
  
  let member;
  let displayName;

  try {
      member = await guild.members.fetch(message.author.id);
      displayName = member.displayName; // nickname or username
      logger.info(`📝 Message received from member: ${displayName}`);
  } catch (err) {
      // fallback if the member isn't in the guild
      member = message.author;
      displayName = member.username;
      logger.warn(`⚠️ Member not found in guild, using User object: ${member.tag}`);
  }

  const parsed = parseWorkMessage(message.content);

    if (!parsed) {
        await message.reply(`Niepoprawny format wiadomości. 
Użyj Formatu: 
Nazwa Zadania* / Klient lub Projekt* / Czas* / KM / Nr. Rejestracji
*pola wymagane`);
        return;
    }

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();

    parsed.date = `${day}.${month}.${year}`;

    await message.reply(`Dziękuję za zgłoszenie! Oto podsumowanie:\n
        Data: ${parsed.date}
        Nazwa Zadania: ${parsed.task}
        Klient / Projekt: ${parsed.client}
        Czas: ${parsed.time}
        Km: ${parsed.km}
        Nr. Rejestracji ${parsed.registration}`);

    try {
        const filePath = await updateExcelFile(member, parsed);

        await message.reply({ 
            content: 'Twój raport został zaktualizowany.', files: [filePath] 
        });
    } catch (err) {
        logger.error('❌ Error updating Excel file:', err);
        await message.reply('Wystąpił błąd podczas aktualizacji raportu. Proszę spróbuj ponownie później.');
    }
});

cron.schedule('0 16 * * 1-5', async () => {
  const date = new Date().toISOString().slice(0, 10);

  try {
    const supervisor = await client.users.fetch(REPORT_USER_ID);

    const zipPath = await zipDailyReports(date);

    await supervisor.send({ 
      content: `Dzienny raport za dzień ${date}`, 
      files: [zipPath] 
    });

    logger.info(`✅ Daily report for ${date} sent to supervisor.`);
  } catch (err) {
    logger.error('❌ Error sending daily report:', err);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});

client.login(DISCORD_TOKEN);