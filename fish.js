const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// 모든 인텐트 활성화
const allIntents = Object.values(GatewayIntentBits);

const client = new Client({
    intents: allIntents,
});

// 봇 준비 메시지
client.on('ready', () => {
    console.log("낚시 봇이 준비되었습니다.");
});

// 버튼 클릭 시 답장으로 응답
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
  
    try {
      // 버튼 클릭 시 응답 메시지 전송 (ephemeral: true를 사용하여 본인만 볼 수 있게)
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
    } catch (error) {
      console.error('응답 메시지 전송 중 오류 발생:', error);
      await interaction.reply({ content: '응답 메시지를 보내는 데 문제가 발생했습니다.', ephemeral: true });
    }
  });

// !버튼 명령어 입력 시 새 메시지 전송
client.on('messageCreate', async (message) => {

    if (message.content === '!버튼') {
        const member = await message.guild.members.fetch(message.author.id);
        if (!message.member || !message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('이 명령어는 관리자만 사용할 수 있습니다.');
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

        // 새로운 메시지 전송
        await message.channel.send({ content: '아래 버튼을 눌러보세요!', components: [row] });
    }
});

client.login('')