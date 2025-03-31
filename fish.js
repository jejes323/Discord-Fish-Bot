const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders'); 

// 모든 인텐트 활성화
const allIntents = Object.values(GatewayIntentBits);

const client = new Client({
    intents: allIntents,
});

// 봇 준비 메시지
client.on('ready', () => {
    console.log("낚시 봇이 준비되었습니다.");
});

// 슬래시 명령어 등록
client.on('ready', async () => {
  const commands = [
    new SlashCommandBuilder()
      .setName('버튼')
      .setDescription('버튼을 생성합니다.')
  ];

  // 서버에 슬래시 명령어 등록
  await client.application.commands.set(commands);
  console.log('슬래시 명령어가 등록되었습니다.');
});

// 슬래시 명령어 처리
client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    if (interaction.commandName === '버튼') {
      // 관리자만 사용할 수 있도록 권한 체크
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member.permissions.has('ADMINISTRATOR')) {
        return interaction.reply({
          content: '이 명령어는 관리자만 사용할 수 있습니다.',
          ephemeral: true
        });
      }

      // 버튼 생성
      const button1 = new ButtonBuilder()
        .setCustomId('fish')
        .setLabel('🎣 낚시하기')
        .setStyle(ButtonStyle.Primary);

      const button2 = new ButtonBuilder()
        .setCustomId('shop')
        .setLabel('💰 상점')
        .setStyle(ButtonStyle.Primary);

      const button3 = new ButtonBuilder()
        .setCustomId('rank')
        .setLabel('🏆 랭킹')
        .setStyle(ButtonStyle.Primary);

      const button4 = new ButtonBuilder()
        .setCustomId('profile')
        .setLabel('👤 내정보')
        .setStyle(ButtonStyle.Secondary);

      // 액션 행 생성
      const row = new ActionRowBuilder().addComponents(button1, button2, button3, button4); // 버튼 4도 추가

      // 새로운 메시지 전송 (전체 채널에서 볼 수 있는 메시지)
      await interaction.channel.send({
        content: '아래 버튼을 눌러보세요!',
        components: [row], // 버튼 포함
        ephemeral: false // 모든 사용자가 볼 수 있도록 설정
      });
    }
  }

  // 버튼 클릭 시 답장으로 응답
  if (interaction.isButton()) {
    switch (interaction.customId) {
      case 'fish':
        await interaction.reply({ content: '🔵 낚시하기 버튼을 클릭했습니다!', ephemeral: true });
        break;
      case 'shop':
        await interaction.reply({ content: '🟢 상점 버튼을 클릭했습니다!', ephemeral: true });
        break;
      case 'rank':
        await interaction.reply({ content: '🔴 랭킹 버튼을 클릭했습니다!', ephemeral: true });
        break;
      case 'profile':
        await interaction.reply({ content: '👤 내정보 버튼을 클릭했습니다!', ephemeral: true });
        break;
    }
  }
});

client.login('')