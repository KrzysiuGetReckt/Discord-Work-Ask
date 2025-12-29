require('dotenv').config();
const { Client, GatewayIntentBits, Events, Partials } = require('discord.js');
// Helper functions
const { isWithinWorkingHours, sleep } = require('./helperFunctions/isWithinWorkingHours');
const { parseWorkMessage } = require('./helperFunctions/parseWorkMessage');
const { updateExcelFile } = require('./helperFunctions/updateExcelFile');


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
  DM_DELAY_MS
} = process.env;

let guild; // keep reference

client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  guild = await client.guilds.fetch(GUILD_ID);
  await guild.members.fetch(); // cache all members

  setInterval(runScheduledDMs, Number(INTERVAL_MS));
});

async function runScheduledDMs() {
  if (!isWithinWorkingHours()) {
    console.log('Outside working hours. Skipping DM send.');
    return;
  }

  console.log('Sending scheduled DMs...');

  const role = guild.roles.cache.get(ROLE_ID);
  if (!role) return console.error('Role not found');

  for (const member of role.members.values()) {
    if (member.user.bot) continue;

    try {
      await member.send(
        `Hej ${member.user.username}!
Pamiętaj o wpisaniu godzin do Raportu!
Możesz to zrobić odpowiadając mi na tym czatcie!
Format:
Os. Wyk. | Data | Rodzaj Usługi | Nazwa Zadania | Osoba zlecająca | Klient/Projekt | Dział IT | Czas.`
      );

      console.log(`DM sent to ${member.user.tag}`);
    } catch (err) {
      console.error(`Failed to DM ${member.user.tag}:`, err.message);
    }

    // throttle to avoid rate limits
    await sleep(Number(DM_DELAY_MS));
  }
}


client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.guild)    return; // Only process DMs

  const parsed = parseWorkMessage(message.content);

    if (!parsed) {
        await message.reply('Niepoprawny format wiadomości. Użyj formatu: Data | Rodzaj Usługi | Nazwa Zadania | Osoba zlecająca | Klient/Projekt | Dział IT | Czas');
        return;
    }
    await message.reply(`Dziękuję za zgłoszenie! Oto podsumowanie Twojego wpisu:\n
        Data: ${parsed.date}\n
        Rodzaj Usługi: ${parsed.service}\n
        Nazwa Zadania: ${parsed.task}\n
        Osoba zlecająca: ${parsed.ordering}\n
        Klient/Projekt: ${parsed.client}\n
        Dział IT: ${parsed.it}\n
        Czas: ${parsed.time}`);
    
    try {
        const filePath = await updateExcelFile(message.author, parsed);

        await message.reply({ 
            content: 'Twój raport został zaktualizowany.', files: [filePath] 
        });
    } catch (err) {
        console.error('Error updating Excel file:', err);
        await message.reply('Wystąpił błąd podczas aktualizacji raportu. Proszę spróbuj ponownie później.');
    }
});

client.login(DISCORD_TOKEN);