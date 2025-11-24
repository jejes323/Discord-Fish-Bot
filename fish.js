const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const Database = require('better-sqlite3');

// 모든 인텐트 활성화
const allIntents = Object.values(GatewayIntentBits);

const client = new Client({
  intents: allIntents,
});

// 낚시 상태 저장 (userId -> 시작 시간)
const fishingUsers = new Map();

// 데이터베이스 초기화
const db = new Database('fish_database.db');

// 물고기 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS fish (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    rarity TEXT NOT NULL,
    price INTEGER NOT NULL
  )
`);

console.log('데이터베이스가 초기화되었습니다.');

// 등급별 확률로 랜덤 선택
function getRandomRarity() {
  const rand = Math.random() * 100;
  if (rand < 80) return '일반';      // 80%
  if (rand < 91) return '레어';      // 11%
  if (rand < 96) return '에픽';      // 5%
  if (rand < 99) return '전설';      // 3%
  return '신화';                   // 1%
}

// 등급별 색상 반환
function getRarityColor(rarity) {
  switch (rarity) {
    case '일반': return '#808080'; // 회색
    case '레어': return '#0080FF'; // 파란색
    case '에픽': return '#A020F0'; // 보라색
    case '전설': return '#FF8C00'; // 주황색
    case '신화': return '#FFD700'; // 금색
    default: return '#808080';
  }
}

// 봇 준비 메시지
client.on('ready', () => {
  console.log("낚시 봇이 준비되었습니다.");
});

// 슬래시 명령어 등록
client.on('ready', async () => {
  const commands = [
    new SlashCommandBuilder()
      .setName('버튼')
      .setDescription('버튼을 생성합니다.'),
    new SlashCommandBuilder()
      .setName('물고기추가')
      .setDescription('새로운 물고기를 추가합니다.')
      .addStringOption(option =>
        option.setName('등급')
          .setDescription('물고기 등급')
          .setRequired(true)
          .addChoices(
            { name: '일반', value: '일반' },
            { name: '레어', value: '레어' },
            { name: '에픽', value: '에픽' },
            { name: '전설', value: '전설' },
            { name: '신화', value: '신화' }
          ))
      .addStringOption(option =>
        option.setName('이름')
          .setDescription('물고기 이름')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('가격')
          .setDescription('물고기 가격')
          .setRequired(true)),
    new SlashCommandBuilder()
      .setName('물고기삭제')
      .setDescription('물고기를 삭제합니다.')
      .addStringOption(option =>
        option.setName('이름')
          .setDescription('삭제할 물고기 이름')
          .setRequired(true))
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
        .setCustomId('inventory')
        .setLabel('💼 인벤토리')
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

    // 물고기 추가 명령어
    if (interaction.commandName === '물고기추가') {
      // 관리자 권한 체크
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member.permissions.has('Administrator')) {
        return interaction.reply({
          content: '이 명령어는 관리자만 사용할 수 있습니다.',
          ephemeral: true
        });
      }

      const rarity = interaction.options.getString('등급');
      const name = interaction.options.getString('이름');
      const price = interaction.options.getInteger('가격');

      try {
        // 데이터베이스에 물고기 추가
        const stmt = db.prepare('INSERT INTO fish (name, rarity, price) VALUES (?, ?, ?)');
        stmt.run(name, rarity, price);

        const successEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ 물고기 추가 성공')
          .setDescription(`새로운 물고기가 추가되었습니다!`)
          .addFields(
            { name: '이름', value: name, inline: true },
            { name: '등급', value: rarity, inline: true },
            { name: '가격', value: `${price}원`, inline: true }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      } catch (error) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ 물고기 추가 실패')
          .setDescription(`이미 존재하는 물고기 이름이거나 오류가 발생했습니다.`)
          .addFields(
            { name: '오류 내용', value: error.message }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }

    // 물고기 삭제 명령어
    if (interaction.commandName === '물고기삭제') {
      // 관리자 권한 체크
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member.permissions.has('Administrator')) {
        return interaction.reply({
          content: '이 명령어는 관리자만 사용할 수 있습니다.',
          ephemeral: true
        });
      }

      const name = interaction.options.getString('이름');

      try {
        // 물고기 존재 확인
        const checkStmt = db.prepare('SELECT * FROM fish WHERE name = ?');
        const fish = checkStmt.get(name);

        if (!fish) {
          const notFoundEmbed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('⚠️ 물고기를 찾을 수 없음')
            .setDescription(`'${name}' 이름의 물고기가 존재하지 않습니다.`)
            .setTimestamp();

          return await interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
        }

        // 데이터베이스에서 물고기 삭제
        const deleteStmt = db.prepare('DELETE FROM fish WHERE name = ?');
        deleteStmt.run(name);

        const successEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ 물고기 삭제 성공')
          .setDescription(`물고기가 삭제되었습니다!`)
          .addFields(
            { name: '이름', value: fish.name, inline: true },
            { name: '등급', value: fish.rarity, inline: true },
            { name: '가격', value: `${fish.price}원`, inline: true }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      } catch (error) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ 물고기 삭제 실패')
          .setDescription(`물고기 삭제 중 오류가 발생했습니다.`)
          .addFields(
            { name: '오류 내용', value: error.message }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }

  // 버튼 클릭 시 답장으로 응답
  if (interaction.isButton()) {
    switch (interaction.customId) {
      case 'fish':
        const userId = interaction.user.id;
        const currentTime = Date.now();

        // 낚시 중인지 확인
        if (fishingUsers.has(userId)) {
          const startTime = fishingUsers.get(userId);
          const elapsedTime = Math.floor((currentTime - startTime) / 1000); // 경과 시간 (초)
          const remainingTime = 60 - elapsedTime; // 남은 시간 (초)

          if (remainingTime > 0) {
            const progressEmbed = new EmbedBuilder()
              .setColor('#FFA500')
              .setTitle('🎣 낚시를 기다리는 중..')
              .setDescription('당신은 이미 낚시를 진행하고 있습니다.')
              .addFields(
                { name: '⏰ 남은 시간', value: `${remainingTime}초`, inline: true }
              )
              .setTimestamp();

            await interaction.reply({
              embeds: [progressEmbed],
              ephemeral: true
            });
            return;
          }
        }

        // 낚시 시작
        fishingUsers.set(userId, currentTime);

        const startEmbed = new EmbedBuilder()
          .setColor('#00BFFF')
          .setTitle('🎣 낚시 시작')
          .setDescription('낚시를 시작했습니다. 행운을 빕니다!')
          .addFields(
            { name: '⏱️ 소요 시간', value: '1분', inline: false },
            { name: '📬 알림', value: 'DM으로 결과를 보내드립니다', inline: false }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [startEmbed], ephemeral: true });

        // 1분 후 DM 전송
        setTimeout(async () => {
          fishingUsers.delete(userId); // 낚시 상태 제거

          try {
            const user = await client.users.fetch(userId);

            // 랜덤으로 등급 선택
            const rarity = getRandomRarity();

            // 해당 등급의 물고기 조회
            const fishList = db.prepare('SELECT * FROM fish WHERE rarity = ?').all(rarity);

            if (fishList.length > 0) {
              // 랜덤으로 물고기 선택
              const selectedFish = fishList[Math.floor(Math.random() * fishList.length)];

              const resultEmbed = new EmbedBuilder()
                .setColor(getRarityColor(rarity))
                .setTitle('🎣 낚시 성공!')
                .setDescription(`축하합니다! 물고기를 잡았습니다!`)
                .addFields(
                  { name: '⭐ 등급', value: rarity, inline: true },
                  { name: '🐟 이름', value: selectedFish.name, inline: true },
                  { name: '💰 가격', value: `${selectedFish.price}원`, inline: true }
                )
                .setTimestamp();

              await user.send({ embeds: [resultEmbed] });
            } else {
              // 해당 등급의 물고기가 없을 경우
              const noFishEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('🎣 낚시 완료')
                .setDescription(`낚시가 끝났지만, ${rarity} 등급의 물고기가 아직 등록되지 않았습니다.`)
                .addFields(
                  { name: '⭐ 선택된 등급', value: rarity }
                )
                .setTimestamp();

              await user.send({ embeds: [noFishEmbed] });
            }
          } catch (error) {
            console.error('DM 전송 실패:', error);
          }
        }, 60000); // 60,000ms = 1분
        break;
      case 'shop':
        await interaction.reply({ content: '💰 상점 버튼을 클릭했습니다!', ephemeral: true });
        break;
      case 'inventory':
        await interaction.reply({ content: '💼 인벤토리 버튼을 클릭했습니다!', ephemeral: true });
        break;
      case 'profile':
        await interaction.reply({ content: '👤 내정보 버튼을 클릭했습니다!', ephemeral: true });
        break;
    }
  }
});

client.login('')