/* Skyrim Assist — Skill Training guide */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const UESP = (p) => "https://en.uesp.net/wiki/Skyrim:" + p;

  // ---------------------------------------------------------------- meta tips
  const META = [
    {
      title: "Guardian Stones", big: "+20%",
      html: `<p>The Mage, Thief and Warrior Stones sit together by the road southwest of Riverwood, at Lake Ilinalta. Pick the one that covers the skills you're grinding right now. You can swap stones any time.</p>
        <ul><li><b>Warrior:</b> One-handed, Two-handed, Block, Heavy Armor, Smithing</li>
        <li><b>Thief:</b> Alchemy, Archery, Light Armor, Lockpicking, Pickpocket, Sneak, Speech</li>
        <li><b>Mage:</b> all six magic schools including Enchanting</li></ul>`,
    },
    {
      title: "The Lover Stone", big: "+15%",
      html: `<p>Every skill improves 15% faster. Use it when you're training several skills from different groups at once. The stone is north of Kolskeggr Mine, northeast of Markarth.</p>`,
    },
    {
      title: "Sleep first", big: "+5–15%",
      html: `<p>Sleeping gives a bonus to all skills for 8 in-game hours. Only one sleep bonus is active at a time.</p>
        <ul><li><b>Rested +5%:</b> any bed, bedroll or hay pile</li>
        <li><b>Well Rested +10%:</b> a bed you own or an inn bed you rented</li>
        <li><b>Lover's Comfort +15%:</b> sleep in the same building as your spouse</li></ul>
        <p>In Survival Mode the rules change and Well Rested only lasts 4 hours.</p>`,
    },
    {
      title: "Aetherial Crown", big: "2 stones",
      html: `<p>A reward from the Dawnguard quest <b>Lost to the Ages</b>. While you wear it you keep two Standing Stones at once, such as the Lover Stone plus a Guardian Stone. Take it off and put it back on after you sleep, or the bonuses don't all stack.</p>`,
    },
    {
      title: "Trainers", big: "5 / level",
      html: `<p>You can buy 5 training sessions per character level, and unused sessions don't carry over. <b>Common</b> trainers go up to 50, <b>Expert</b> to 75 and <b>Master</b> to 90. Spend your sessions right before you level up.</p>
        <p>Pickpocketing your fee back is the classic way to make training free. It's listed under Pickpocket below.</p>`,
    },
    {
      title: "Free skill points", big: "+1 / +5",
      html: `<p>Each skill book gives +1 the first time you read it. The <b>Oghma Infinium</b>, from the quest <b>Discerning the Transmundane</b>, gives +5 to every skill in one group: combat, stealth or magic. Pick the group you'd otherwise grind the slowest.</p>`,
    },
    {
      title: "Legendary skills", big: "∞",
      html: `<p>At 100 you can make a skill Legendary. It drops back to 15 and you get its perk points back. Training it again keeps raising your character level, which is the only way past level 81. The fast methods below are what make this worth doing.</p>`,
    },
    {
      title: "XP rules that matter",
      html: `<ul><li>Combat XP depends on the weapon's <b>base</b> damage. Perks, tempering and enchantments add nothing, and enemies that die faster give you fewer hits.</li>
        <li>Crafting XP depends on the value of what you make, so the gear and perks that make potions or items worth more also train the skill faster.</li>
        <li>Going to jail costs you skill progress, so pay your bounties.</li>
        <li>Enemies scale with your character level, so maxing a crafting skill early makes fights harder. Train a combat skill alongside it.</li></ul>`,
    },
  ];

  // ---------------------------------------------------------------- skills
  // tier: legit | optimised | exploit
  const SKILLS = [
    // ===================== WARRIOR
    {
      id: "one-handed", name: "One-handed", group: "warrior", stone: "Warrior Stone",
      trainers: [["Amren", "Whiterun", "Common"], ["Athis", "Jorrvaskr, Whiterun", "Expert"], ["Chief Burguk", "Dushnikh Yal", "Master"]],
      methods: [
        { tier: "legit", title: "Fight with your highest base-damage weapon", html: `<p>XP comes from <b>base</b> weapon damage on each hit that does damage. A daedric sword trains faster than an iron one, but tempering and perks add nothing.</p>` },
        { tier: "legit", title: "Pick tanky, harmless targets", html: `<p>Horkers on the northern coast are slow, barely dangerous and have plenty of health to work through. Trolls are good too because they regenerate.</p>` },
        { tier: "optimised", title: "Dual-wield flurry", html: `<p>Put a <b>Dragonbone dagger in your left hand</b> and a Dragonbone mace in your right, then tap both attack buttons together for non-power dual strikes. The off-hand weapon sets the swing speed. The Dual Flurry perks and the <b>Elemental Fury</b> shout make it even faster. Needs Dawnguard.</p>` },
        { tier: "exploit", title: "Training dummies that can't die", html: `<p>Essential characters take damage but can't be killed. Good ones are <b>Hadvar or Ralof during Unbound</b>, Shadowmere, your own conjured creatures, Paarthurnax before his quest starts, and M'aiq the Liar. Children and Brynjolf don't count because they never take damage.</p>` },
        { tier: "exploit", title: "Helgen torturer", html: `<p>If you escape with Hadvar, keep the Torturer alive in the torture room. Sneak-attack him with an iron dagger using normal attacks, never power attacks. He only turns hostile after three quick hits in a row. This takes One-handed <i>and</i> Sneak to 100 before you ever leave Helgen.</p><p class="warn">Leaving Helgen at a high level makes the early game brutal, because enemies scale to your level.</p>` },
      ],
    },
    {
      id: "two-handed", name: "Two-handed", group: "warrior", stone: "Warrior Stone",
      trainers: [["Torbjorn Shatter-Shield", "Windhelm", "Expert"], ["Vilkas", "Jorrvaskr, Whiterun", "Master"], ["Fura Bloodmouth", "Volkihar Keep", "Master"], ["Wulf Wild-Blood", "Skaal Village", "Master"]],
      methods: [
        { tier: "legit", title: "Swing the best base-damage weapon", html: `<p>Power attacks don't give more XP per hit, so use quick normal swings. The best options are the <b>Dragonbone Battleaxe</b>, then a Daedric Battleaxe, Volendrung or Wuuthrad. The Longhammer is a bit weaker but swings faster.</p>` },
        { tier: "optimised", title: "Elemental Fury", html: `<p>The Elemental Fury shout speeds up your swings, and more hits per second means more XP per second. Use it on a high-health enemy.</p>` },
        { tier: "exploit", title: "Essential targets", html: `<p>Use the same unkillable dummies as One-handed: Hadvar or Ralof during Unbound, Shadowmere, conjured creatures, Paarthurnax before his quest, and M'aiq.</p>` },
      ],
    },
    {
      id: "block", name: "Block", group: "warrior", stone: "Warrior Stone",
      trainers: [["Njada Stonearm", "Jorrvaskr, Whiterun", "Expert"], ["Chief Larak", "Mor Khazgur", "Master"]],
      methods: [
        { tier: "legit", title: "Block with a shield, not a weapon", html: `<p>XP depends on how much damage you block. A shield gives <b>2×</b> the XP of blocking with a weapon, and light and heavy shields train it equally. Blocking doesn't train your armor skill.</p>` },
        { tier: "optimised", title: "Raise your block percentage", html: `<p>Perks, enchantments and potions that block more damage also raise XP per block, up to the cap. Shield bashes give 5× a weapon bash but cost a lot of stamina, so blocking is still better.</p>` },
        { tier: "optimised", title: "Tank weak enemies with regen", html: `<p>Wear Regenerate Health gear and let something weak keep hitting you, like skeevers or a brawl. To train against stronger magic users, use the <b>Spellbreaker</b> shield against a conjured Dremora Lord.</p>` },
        { tier: "exploit", title: "Free training from Njada or Chief Larak", html: `<p>Pay for training, then pickpocket the fee back (see Pickpocket). Njada can also be your follower after the Companions questline, so you could take the gold from her inventory.</p>`, patched: "Unofficial Patch (follower part only)" },
      ],
    },
    {
      id: "heavy-armor", name: "Heavy Armor", group: "warrior", stone: "Warrior Stone",
      trainers: [["Gharol", "Dushnikh Yal", "Expert"], ["Farkas", "Jorrvaskr, Whiterun", "Master"], ["Isran", "Fort Dawnguard", "Master"], ["Kuvar", "Thirsk Mead Hall", "Master"]],
      methods: [
        { tier: "legit", title: "Get hit by hard hitters in a full set", html: `<p>XP depends on the attacker's raw damage, not on how much your armor stops. Wearing more heavy pieces gives more XP, and mixing in light armor splits it. Don't block while training.</p>` },
        { tier: "optimised", title: "Giants and Restoration", html: `<p>Two giants level you very fast if you have about 300+ health. Heal yourself between hits to train Restoration at the same time.</p>` },
        { tier: "optimised", title: "AFK regen tank", html: `<p>Stack Regenerate Health gear and let a weak enemy hit you while you leave the game running. It's slow, but you don't have to do anything.</p>` },
        { tier: "exploit", title: "Free training from Farkas", html: `<p>Farkas is a Master trainer and can be your follower after the Companions questline. Train with him, then take the gold back out of his inventory.</p>`, patched: "Unofficial Patch" },
      ],
    },
    {
      id: "smithing", name: "Smithing", group: "warrior", stone: "Warrior Stone",
      trainers: [["Ghorza gra-Bagol", "Markarth", "Common"], ["Balimund", "Riften", "Expert"], ["Eorlund Gray-Mane", "Whiterun", "Master"], ["Gunmar", "Fort Dawnguard", "Master"]],
      methods: [
        { tier: "legit", title: "Spam cheap items", html: `<p>Every crafted item gives a flat <b>+25 XP</b> on top of an amount based on its value. That makes many cheap items better than a few expensive ones. Five <b>iron daggers</b> give about twice the XP of one iron armor from the same ingots. Leather bracers give the most XP per leather. Smelting and tanning give no XP.</p>` },
        { tier: "legit", title: "Improve gear at the workbench", html: `<p>Improving items gives XP based on how much value you add. It's a good use of leftover ingots once you have the perks.</p>` },
        { tier: "optimised", title: "Transmute to gold jewelry", html: `<p>Learn <b>Transmute Mineral Ore</b> (there's a free tome at Halted Stream Camp, which also has plenty of iron ore). Transmute iron ore to silver, then to gold, and make <b>gold rings</b>. You get about a third more Smithing XP per ore than from daggers, plus Alteration XP from casting. Add gems to necklaces and rings for much more.</p>` },
        { tier: "optimised", title: "Smith, enchant, sell", html: `<p>Make iron daggers, enchant them with petty soul gems, and sell them. One stack of ore trains Smithing, Enchanting and Speech and makes money too.</p>` },
        { tier: "exploit", title: "Improve gear with absurd Fortify Smithing", html: `<p>Use the Fortify Restoration loop (see Alchemy) to make huge Fortify Smithing potions or gear. Improving an item under that boost adds an enormous amount of value, and improvement XP is based on value added.</p>` },
      ],
    },
    {
      id: "archery", name: "Archery", group: "warrior", stone: "Thief Stone (really!)",
      trainers: [["Faendal", "Riverwood", "Common"], ["Aela the Huntress", "Jorrvaskr, Whiterun", "Expert"], ["Niruin", "Ragged Flagon, Riften", "Master"], ["Sorine Jurard", "Fort Dawnguard", "Master"]],
      methods: [
        { tier: "legit", title: "Use the highest-DPS bow you can", html: `<p>Each hit that does damage gives XP based on the bow's base damage. Arrow type, a full draw, sneak multipliers, perks and tempering add nothing, so a fast bow beats a slow strong one.</p><p>Archery is in the Warrior skill group, but the <b>Thief Stone</b> is the one that boosts it.</p>` },
        { tier: "optimised", title: "Hunt from stealth", html: `<p>Shoot deer, elk and wolves while crouched to train Archery and Sneak together, and sell or use the pelts and meat.</p>` },
        { tier: "exploit", title: "Shoot essential targets", html: `<p>Shoot Shadowmere, your conjured creatures, or Hadvar or Ralof during Unbound. At the end of the Helgen escape tunnel you're given a bow, so you can shoot your companion there. You can't get the arrows back, though.</p>` },
        { tier: "exploit", title: "Faendal and Aela train for free", html: `<p>Both can become followers. Pay for training, then take the gold back through their inventory.</p>`, patched: "Unofficial Patch" },
      ],
    },
    // ===================== THIEF
    {
      id: "light-armor", name: "Light Armor", group: "thief", stone: "Thief Stone",
      trainers: [["Scouts-Many-Marshes", "Windhelm", "Common"], ["Grelka", "Riften", "Expert"], ["Nazir", "Dark Brotherhood Sanctuary", "Master"]],
      methods: [
        { tier: "legit", title: "Wear a full set and take real hits", html: `<p>XP depends on how hard you're hit, not on your armor rating. Tougher enemies train you faster. Wear all four pieces, because each piece adds XP, and don't block.</p>` },
        { tier: "optimised", title: "Heal while you tank", html: `<p>Let enemies hit you while you heal with Restoration spells. You train Light Armor and Restoration at the same time.</p>` },
        { tier: "optimised", title: "AFK regen tank", html: `<p>With Regenerate Health enchantments or potions, a weak enemy (or a brawl) can hit you forever while you're away from the keyboard. It's slow but needs no attention.</p>` },
        { tier: "exploit", title: "Free training from Nazir or Grelka", html: `<p>Light Armor is slow to train by getting hit, so spend training sessions on it and pickpocket each fee back (see Pickpocket). Nazir, the Master trainer, is in the Dark Brotherhood Sanctuary.</p>` },
      ],
    },
    {
      id: "sneak", name: "Sneak", group: "thief", stone: "Thief Stone",
      trainers: [["Khayla", "Khajiit Caravans", "Common"], ["Garvey", "Markarth", "Expert"], ["Delvin Mallory", "Ragged Flagon, Riften", "Master"]],
      methods: [
        { tier: "legit", title: "Sneak attacks", html: `<p>Each successful sneak attack gives a flat amount of XP regardless of damage, and <b>melee sneak attacks give 12×</b> what ranged ones do. A dagger build trains Sneak very quickly.</p>` },
        { tier: "legit", title: "Creep through hostile areas", html: `<p>Just staying undetected near people trains Sneak slowly. It's faster near hostile NPCs or shopkeepers, and the XP scales with how many are nearby. The grounds of <b>Goldenglow Estate</b>, with up to 9 hostiles, are ideal.</p>` },
        { tier: "optimised", title: "Stab your horse", html: `<p>Buy a horse, sneak-attack it with an iron dagger, heal it with a spell, and repeat. On a higher difficulty it survives more hits between heals.</p>` },
        { tier: "optimised", title: "Calm and stab", html: `<p>Hold Calm in your left hand and a weak weapon or fists in your right. Sneak-attack, then cast Calm right away so the target stays docile. Trolls work well because they heal themselves.</p>` },
        { tier: "optimised", title: "Friendly dummies", html: `<p>Conjured <b>Dremora Lords</b> always spawn facing away from you. The Greybeards while praying and Balgruuf (after the Dragonstone, before Western Watchtower) also work. For passive Sneak XP, the sickly soldier in Whiterun's Temple of Kynareth never moves.</p>` },
        { tier: "exploit", title: "Helgen infinite sneak", html: `<p>On the Hadvar path, repeatedly sneak-attack the Torturer with an iron dagger using normal attacks. On either path, once your hands are untied, you can take a dagger from a dead soldier and keep sneak-attacking your companion, who can't die. This takes Sneak (and One-handed) as high as you like.</p><p class="warn">You'll leave Helgen badly over-leveled if you overdo it.</p>` },
      ],
    },
    {
      id: "lockpicking", name: "Lockpicking", group: "thief", stone: "Thief Stone",
      trainers: [["Ma'jhad", "Khajiit Caravans", "Expert"], ["Vex", "Ragged Flagon, Riften", "Master"]],
      methods: [
        { tier: "legit", title: "Pick every lock you see", html: `<p>Harder locks give more XP. You only get XP the <b>first</b> time you pick each lock, so relocking chests, including the Thieves Guild practice chests, gives nothing.</p>` },
        { tier: "optimised", title: "Breaking picks still pays", html: `<p>Each broken lockpick gives a small amount of XP. Buy lockpicks in bulk from fences and general stores, and try Expert and Master locks early instead of skipping them.</p>` },
        { tier: "optimised", title: "Use training sessions here", html: `<p>Lockpicking is one of the slowest skills to train by using it. Spend your trainer sessions here, with Vex (Master) or Ma'jhad (Expert).</p>` },
        { tier: "exploit", title: "Steal Vex's fee back", html: `<p>Pay Vex or Ma'jhad for a session, then pickpocket the gold back and repeat until you run out of sessions for the level. Lockpicking and Pickpocket both go up for free.</p>` },
      ],
    },
    {
      id: "pickpocket", name: "Pickpocket", group: "thief", stone: "Thief Stone",
      trainers: [["Silda the Unseen", "Windhelm", "Expert"], ["Vipir the Fleet", "Ragged Flagon, Riften", "Master"]],
      methods: [
        { tier: "legit", title: "Steal small, valuable things", html: `<p>XP depends on the stolen item's <b>value</b>, and the difficulty depends on its <b>weight</b>. Jewelry and gems are ideal. Pickpocket bandits and necromancers too: if you fail, you just get a fight and no bounty.</p>` },
        { tier: "optimised", title: "Reverse-pickpocket gold", html: `<p>Put gold into someone's pocket and steal it back. The bound captives in <b>With Friends Like These…</b> never report you, which makes them perfect. With the Cutpurse perk, about 1,500 gold per round works well. Leave the rest of your gold somewhere safe first.</p>` },
        { tier: "exploit", title: "Trainer pickpocketing", html: `<p>Pay any trainer, steal the fee back, and repeat. Both the trained skill and Pickpocket go up, and it costs you nothing. It works up to about 51 without perks and 76 with them. After that the fee is too heavy to steal. Knocking the trainer down with Unrelenting Force, or slipping them a paralysis poison (Poisoned perk), gets around that limit.</p>` },
        { tier: "exploit", title: "Sibbi Black-Briar's cell", html: `<p>Get a small bounty, go to Riften jail, pick your cell lock and quietly deal with the guards. Then reverse-pickpocket gold to Sibbi through his cell bars and steal it back, over and over. Start around 50 gold and work up to 200. This is the fastest Pickpocket method there is.</p>` },
        { tier: "exploit", title: "The strange amulet resale", html: `<p>During <b>Blood on the Ice</b>, sell the strange amulet to Calixto, pickpocket it back and sell it again, for 500 gold and big Pickpocket XP each time.</p>`, patched: "Unofficial Patch" },
      ],
    },
    {
      id: "speech", name: "Speech", group: "thief", stone: "Thief Stone",
      trainers: [["Dro'marash", "Khajiit Caravans", "Common"], ["Revyn Sadri", "Windhelm", "Common"], ["Ogmund", "Markarth", "Expert"], ["Ronthil", "Volkihar Keep", "Expert"], ["Giraud Gemane", "Bards College, Solitude", "Master"]],
      methods: [
        { tier: "legit", title: "Sell items one at a time", html: `<p>XP is based on the item's real value, not the price you get. Selling a stack counts as <b>one</b> unit, so sell valuable stacks one by one in the same trade window. Persuade, Intimidate and Bribe options in dialogue also give XP.</p>` },
        { tier: "optimised", title: "Sell what your crafting makes", html: `<p>Enchanted daggers, potions from the <a href="./">Alchemy</a> page and gem jewelry are high-value goods you make yourself. Fortify Barter gear lets you buy more for each coin, which also raises XP.</p>` },
        { tier: "optimised", title: "Trainer-merchants", html: `<p>When you pay a trainer who is also a merchant, the gold goes into their shop money. Train five times, then sell them goods to get it back. With a level-up saved for in between, you can trade about 28,000 gold in one visit.</p>` },
        { tier: "exploit", title: "Persuade every guard", html: `<p>Commit a tiny crime with a bounty of 5 gold or less, then talk to every guard in town and persuade (or bribe) them to drop it. Every guard except the one who saw you counts. It goes from 50 to 100 in about 10–15 town visits and needs around 53 Speech with the Persuade perk.</p>` },
        { tier: "exploit", title: "Sell items with absurd value", html: `<p>Gear made with the Fortify Restoration loop or the Alchemy/Enchanting loop is worth enormous amounts. A few sales can max Speech, though the merchant can only pay what gold they have.</p>` },
      ],
    },
    {
      id: "alchemy", name: "Alchemy", group: "thief", stone: "Thief Stone",
      trainers: [["Lami", "Morthal", "Common"], ["Arcadia", "Whiterun", "Expert"], ["Milore Ienth", "Raven Rock", "Expert"], ["Babette", "Dark Brotherhood Sanctuary", "Master"]],
      methods: [
        { tier: "legit", title: "Brew the most valuable potions you can", html: `<p>XP is proportional to the potion's gold value, so the most valuable brews are also the fastest training. Upload your ingredients on the <a href="./">Alchemy</a> page and brew its plan top to bottom.</p><p>The most valuable single effects are <b>Paralysis, Damage Magicka Regen, Invisibility and Slow</b>. More effects in one potion also add value. Take Alchemist, Physician, Benefactor and Poisoner as soon as you can, because they raise potion value and therefore XP.</p>` },
        { tier: "legit", title: "Ingredients worth farming", html: `<ul><li><b>Giant's Toe</b> makes any Fortify Health potion worth far more. Try Giant's Toe + Blue Butterfly Wing + Blue Mountain Flower, or Giant's Toe + Bear Claws + Hanging Moss.</li>
          <li>Without Giant's Toe: Glow Dust + Glowing Mushroom + Hanging Moss.</li>
          <li><b>Frostflow Abyss</b> has around 500 Chaurus Eggs (Invisibility) and 96 Glowing Mushrooms.</li>
          <li><b>Arcadia's Cauldron</b> in Whiterun: buy everything except the rare items, brew it all, sell it back, then train with her.</li></ul>` },
        { tier: "optimised", title: "Fortify Alchemy gear", html: `<p>Fortify Alchemy on <b>head, hands, ring and necklace</b> makes every potion stronger and more valuable. You can wear a Falmer helmet and a circlet together for a fifth piece.</p>` },
        { tier: "optimised", title: "Alchemy and Enchanting loop", html: `<p>No glitch involved. Wear your Fortify Alchemy gear, brew a <b>Fortify Enchanting</b> potion (Blue Butterfly Wing, Hagraven Claw, Snowberries or Spriggan Sap), drink it, and enchant better Fortify Alchemy gear. Repeat a few times until it stops improving.</p>` },
        { tier: "exploit", title: "The Fortify Restoration loop", html: `<ol>
            <li>Wear four or five pieces of Fortify Alchemy gear.</li>
            <li>Brew a <b>Fortify Restoration</b> potion from Abecean Longfin + Cyrodilic Spadetail (Salt Pile works too).</li>
            <li>Drink it, then <b>take off and put back on</b> all your Fortify Alchemy gear. Its bonus is now multiplied.</li>
            <li>Brew another Fortify Restoration potion. It's stronger, so the next re-equip boosts the gear even more. Repeat until the numbers are silly.</li>
            <li>Brew anything you like. Alchemy goes from 15 to 100 in seconds, and the potions break Smithing, Enchanting and Speech too.</li></ol>
            <p class="warn">This boosts everything it touches and can ruin the game's challenge. Use a separate save.</p>` },
      ],
    },
    // ===================== MAGE
    {
      id: "alteration", name: "Alteration", group: "mage", stone: "Mage Stone",
      trainers: [["Dravynea the Stoneweaver", "Kynesgrove", "Expert"], ["Tolfdir", "College of Winterhold", "Master"]],
      methods: [
        { tier: "legit", title: "Flesh spells during fights", html: `<p>Higher-level spells give more XP. Keep recasting Oakflesh or Stoneflesh while a follower or summon does the fighting. With Bound Sword in the other hand you train Conjuration too.</p>` },
        { tier: "optimised", title: "Detect Life in crowds", html: `<p>Detect Life gives XP for every living thing it detects. Cast it in a busy market, like Riften during the day, and you can go from 15 to 100 in about 20 minutes.</p>` },
        { tier: "optimised", title: "Transmute ore", html: `<p>Turn iron ore into silver and gold. It's good Alteration XP outside of combat, and the gold feeds your Smithing jewelry grind.</p>` },
        { tier: "exploit", title: "Free Paralyze", html: `<p>Stack Fortify Alteration gear until spells cost nothing, then dual-cast Paralyze on an enemy over and over. With the Mage Stone it goes from 15 to 100 in under 5 minutes, and you can repeat it after each Legendary reset.</p>` },
      ],
    },
    {
      id: "conjuration", name: "Conjuration", group: "mage", stone: "Mage Stone",
      trainers: [["Runil", "Falkreath", "Common"], ["Phinis Gestor", "College of Winterhold", "Expert"], ["Falion", "Morthal", "Master"], ["Talvas Fathryon", "Tel Mithryn", "Master"]],
      methods: [
        { tier: "legit", title: "Summon and fight", html: `<p>A summon only gives XP once a hostile appears before it vanishes, so you can cast just before a fight. Banishing your own summons also gives XP.</p>` },
        { tier: "optimised", title: "Bound weapon spam", html: `<p>Start a fight with something harmless, like a mudcrab. Cast <b>Bound Sword or Bound Dagger</b>, and cancel as soon as you hear the cast sound so you don't wait for the weapon to appear. Repeat. These give over 4× the XP of Bound Bow.</p>` },
        { tier: "exploit", title: "Soul Trap on corpses", html: `<p>Cast Soul Trap on dead bodies again and again. It gives XP every time, forever.</p>`, patched: "Unofficial Patch (a separate mod brings it back)" },
        { tier: "exploit", title: "Talvas trains for free", html: `<p>Talvas Fathryon is a Master trainer and can be your follower. Pay him, then take the gold back from his inventory.</p>`, patched: "Unofficial Patch" },
      ],
    },
    {
      id: "destruction", name: "Destruction", group: "mage", stone: "Mage Stone",
      trainers: [["Wuunferth the Unliving", "Windhelm", "Common"], ["Sybille Stentor", "Solitude", "Expert"], ["Faralda", "College of Winterhold", "Master"]],
      methods: [
        { tier: "legit", title: "Hit things with expensive spells", html: `<p>XP depends on the spell's <b>base</b> magicka cost, and only counts when the spell hits a valid target. Dual-casting gives no extra XP, so cast with one hand.</p>` },
        { tier: "legit", title: "Train on Adept or lower", html: `<p>Destruction is the one skill where difficulty cuts your XP: Legendary gives 75% less. Adept and below give full XP, and Adept leaves enemies with the most health to hit.</p>` },
        { tier: "optimised", title: "Free casting", html: `<p>Stack Fortify Destruction gear until spells cost nothing, or use the <b>Secret of Arcana</b> power (Dragonborn) for 30 seconds of free casting with your most expensive spell.</p>` },
        { tier: "exploit", title: "Burn essential NPCs", html: `<p>Use Hadvar or Ralof during Unbound (in Helgen keep they won't move until you pick up a weapon, so cast Flames for as long as you like). Other options: Esbern before <b>A Cornered Rat</b>, Ancano before <b>Revealing the Unseen</b>, the Riekling Chief during <b>The Chief of Thirsk Hall</b>, Paarthurnax, M'aiq, and conjured creatures.</p>` },
      ],
    },
    {
      id: "enchanting", name: "Enchanting", group: "mage", stone: "Mage Stone",
      trainers: [["Sergius Turrianus", "College of Winterhold", "Expert"], ["Hamal", "Markarth", "Master"], ["Neloth", "Tel Mithryn", "Master"]],
      methods: [
        { tier: "legit", title: "Disenchant everything new", html: `<p>Learning each new effect gives a big one-time chunk of XP. Apparel effects give more than weapon effects. You can only disenchant one item per effect.</p>` },
        { tier: "legit", title: "Enchant with petty soul gems", html: `<p>Each enchantment gives the <b>same XP</b> no matter the gem size, item or effect. Cheap petty gems do the job as well as grand ones.</p>` },
        { tier: "optimised", title: "Iron dagger factory", html: `<p>Smith iron daggers, enchant them with Damage Stamina or Turn Undead using petty gems, and sell them for more than the materials cost. Banish enchantments sell for much more. This trains Smithing, Enchanting and Speech at once.</p>` },
        { tier: "optimised", title: "Recharge with Azura's Star", html: `<p>Use a weapon with Soul Trap and recharge it from Azura's Star (or the Black Star) after each kill. It's steady extra XP and you never run out of gems.</p>` },
        { tier: "exploit", title: "Restoration / Enchanting loops", html: `<p>A huge Fortify Enchanting potion (see Alchemy) lets one enchantment level you a lot and makes gear with absurd values.</p>` },
        { tier: "exploit", title: "Myrwatch staff enchanter", html: `<p>The staff enchanter at Myrwatch (Creation Club) used to give 20× normal XP.</p>`, patched: "official update 1.6.318" },
      ],
    },
    {
      id: "illusion", name: "Illusion", group: "mage", stone: "Mage Stone",
      trainers: [["Atub", "Largashbur", "Expert"], ["Drevis Neloren", "College of Winterhold", "Master"]],
      methods: [
        { tier: "legit", title: "Calm, Fear and Fury in fights", html: `<p>Higher-level spells give more XP. Turning enemies against each other trains Illusion and makes fights easier.</p>` },
        { tier: "optimised", title: "Muffle on repeat", html: `<p>Casting Muffle on yourself gives XP every time, even with nobody around. It's the easiest Illusion grind at any level.</p>` },
        { tier: "optimised", title: "Courage and Rally on crowds", html: `<p>Casting Courage or Rally on townsfolk isn't a crime. Rally gives more XP, and hitting a group at once multiplies it. Rarely, Vigilants or revelers turn hostile.</p>` },
        { tier: "exploit", title: "Harmony in Whiterun", html: `<p>After the Master Illusion ritual quest, make Illusion Legendary, then spam <b>Harmony</b> in a crowded city with Secret of Arcana active. Hitting enough NPCs can take you from 15 to 100 in under 30 seconds.</p>` },
      ],
    },
    {
      id: "restoration", name: "Restoration", group: "mage", stone: "Mage Stone",
      trainers: [["Aphia Velothi", "Raven Rock", "Common"], ["Colette Marence", "College of Winterhold", "Expert"], ["Keeper Carcette", "Hall of the Vigilant", "Expert"], ["Danica Pure-Spring", "Whiterun", "Master"], ["Florentius Baenius", "Fort Dawnguard", "Master"]],
      methods: [
        { tier: "legit", title: "Heal real damage", html: `<p>Healing only gives XP when it restores missing health, on you or someone else. Wards cast in short 1-second bursts during combat train fast below 65.</p>` },
        { tier: "optimised", title: "Equilibrium, then heal", html: `<p><b>Equilibrium</b> (an Alteration spell) trades your health for magicka. Cast it, then heal the health you lost. You always have the magicka to heal, and the health is real damage, so the healing counts.</p>` },
        { tier: "optimised", title: "Circle of Protection anywhere", html: `<p>Once you can cast it, at 65, it gives XP whenever you cast it. Vampires gain more because they count as undead standing inside it. A reanimated corpse from the Staff of Worms or Staff of Revenants also lets you spam Turn Undead.</p>` },
        { tier: "optimised", title: "Heal while tanking", html: `<p>Combine this with Light/Heavy Armor training: let enemies hit you while you heal it back.</p>` },
        { tier: "exploit", title: "Stand in lava", html: `<p>After <b>Lost to the Ages</b>, the lava behind the Aetherium Forge does up to 165 damage per second. Stand in it and spam your strongest heals.</p>` },
      ],
    },
  ];

  const GROUPS = { warrior: "Warrior", thief: "Thief", mage: "Mage" };
  const TIERS = { legit: "Legit", optimised: "Optimised", exploit: "Exploit" };
  const ICONS = {
    warrior: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 3.5 20.5 3.5 20.5 9.5 9 21 3 15z"/><path d="M6 12l6 6M4 20l2-2"/></svg>`,
    thief: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.6"/></svg>`,
    mage: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/></svg>`,
  };
  const CHEV = `<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;

  // ---------------------------------------------------------------- state
  const store = {
    get(k, d) { try { const v = localStorage.getItem("skills-" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("skills-" + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };
  const ui = {
    group: store.get("group", "all"),
    tiers: new Set(store.get("tiers", ["legit", "optimised", "exploit"])),
    open: new Set(store.get("open", [])),
    q: "",
  };

  // ---------------------------------------------------------------- render meta
  function renderMeta() {
    const box = $("#meta");
    box.innerHTML = META.map((m, i) => `<article class="tip" style="animation-delay:${i * 40}ms"><h3><span>${m.title}</span>${m.big ? `<span class="big">${m.big}</span>` : ""}</h3>${m.html}</article>`).join("");
    // XP multiplier widget
    const calc = document.createElement("article");
    calc.className = "tip xpcalc";
    calc.innerHTML = `<div class="opts">
        <h3><span>Your XP multiplier</span></h3>
        <div class="row" data-k="stone"><span>Stone</span></div>
        <div class="row" data-k="sleep"><span>Sleep</span></div>
      </div>
      <div class="mult"><b id="multOut">×1.00</b><span>XP per action</span></div>`;
    const opts = {
      stone: [["none", "None", 1], ["guardian", "Guardian", 1.2], ["lover", "Lover", 1.15], ["crown", "Crown: both", 1.2 * 1.15]],
      sleep: [["none", "None", 1], ["rested", "Rested", 1.05], ["well", "Well Rested", 1.1], ["spouse", "Lover's Comfort", 1.15]],
    };
    const sel = { stone: store.get("calc-stone", "guardian"), sleep: store.get("calc-sleep", "well") };
    for (const k of Object.keys(opts)) {
      const row = calc.querySelector(`[data-k="${k}"]`);
      for (const [v, label] of opts[k]) {
        const b = document.createElement("button");
        b.className = "chip-btn"; b.textContent = label; b.dataset.v = v;
        b.setAttribute("aria-pressed", String(sel[k] === v));
        b.onclick = () => { sel[k] = v; store.set("calc-" + k, v); row.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); update(true); };
        row.appendChild(b);
      }
    }
    function update(bump) {
      const f = (k) => opts[k].find((o) => o[0] === sel[k])[2];
      const out = calc.querySelector("#multOut");
      out.textContent = "×" + (f("stone") * f("sleep")).toFixed(2);
      if (bump) { out.classList.remove("bump"); void out.offsetWidth; out.classList.add("bump"); }
    }
    update(false);
    box.appendChild(calc);
  }

  // ---------------------------------------------------------------- render skills
  function chipRow(box, items, isOn, onClick, cls) {
    box.innerHTML = "";
    for (const [v, label] of items) {
      const b = document.createElement("button");
      b.className = "chip-btn" + (cls ? " " + cls(v) : "");
      b.textContent = label;
      b.setAttribute("aria-pressed", String(isOn(v)));
      b.onclick = () => onClick(v);
      box.appendChild(b);
    }
  }

  function renderToolbar() {
    chipRow($("#groupChips"), [["all", "All"], ...Object.entries(GROUPS)], (v) => ui.group === v, (v) => { ui.group = v; store.set("group", v); renderToolbar(); applyFilters(); });
    chipRow($("#tierChips"), Object.entries(TIERS), (v) => ui.tiers.has(v), (v) => {
      if (ui.tiers.has(v) && ui.tiers.size > 1) ui.tiers.delete(v); else ui.tiers.add(v);
      store.set("tiers", [...ui.tiers]); renderToolbar(); applyFilters();
    }, (v) => "t-" + v);
  }

  function methodHTML(m) {
    return `<li class="method ${m.tier}" data-tier="${m.tier}">
      <div class="m-head"><span class="badge ${m.tier}">${TIERS[m.tier]}</span><span class="m-title">${m.title}</span>${m.patched ? `<span class="badge patched" title="Fixed by this patch; won't work if you have it installed">Patched: ${m.patched}</span>` : ""}</div>
      ${m.html}</li>`;
  }

  function renderSkills() {
    const ul = $("#skills");
    ul.innerHTML = "";
    SKILLS.forEach((s, i) => {
      const counts = { legit: 0, optimised: 0, exploit: 0 };
      s.methods.forEach((m) => counts[m.tier]++);
      const li = document.createElement("li");
      li.className = "skill" + (ui.open.has(s.id) ? " open" : "");
      li.id = s.id;
      li.dataset.group = s.group;
      li.style.animationDelay = Math.min(i * 25, 400) + "ms";
      li._text = (s.name + " " + s.methods.map((m) => m.title + " " + m.html.replace(/<[^>]+>/g, " ")).join(" ")).toLowerCase();
      li.innerHTML = `
        <button class="skill-head" aria-expanded="${ui.open.has(s.id)}" aria-controls="${s.id}-body">
          <span class="sk-icon">${ICONS[s.group]}</span>
          <span class="sk-name">${s.name}<span class="sk-sub">${GROUPS[s.group]} skill · boosted by ${s.stone}</span></span>
          <span class="sk-counts" aria-label="${counts.legit} legit, ${counts.optimised} optimised, ${counts.exploit} exploit methods">
            ${Object.keys(counts).map((t) => `<span class="c-${t}" title="${TIERS[t]}">${counts[t]}</span>`).join("")}
          </span>
          ${CHEV}
        </button>
        <div class="skill-body" id="${s.id}-body" role="region" aria-label="${s.name} training methods">
          <div class="inner"><div class="pad">
            <ol class="methods">${s.methods.map(methodHTML).join("")}</ol>
            <div class="skill-foot">
              <span>Trainers: ${s.trainers.map(([n, where, lv]) => `<b>${n}</b> <span class="lv">(${lv}, ${where})</span>`).join(" · ")}</span>
              <a href="${UESP(s.name.replace(/ /g, "_"))}" target="_blank" rel="noopener">UESP: ${s.name} ↗</a>
            </div>
          </div></div>
        </div>`;
      li.querySelector(".skill-head").addEventListener("click", () => toggle(li));
      ul.appendChild(li);
    });
  }

  function stagger(li) {
    li.querySelectorAll(".method").forEach((m, i) => { m.style.transitionDelay = li.classList.contains("open") ? 80 + i * 55 + "ms" : "0ms"; });
  }

  function toggle(li, force) {
    const open = force == null ? !li.classList.contains("open") : force;
    li.classList.toggle("open", open);
    li.querySelector(".skill-head").setAttribute("aria-expanded", String(open));
    stagger(li);
    if (open) ui.open.add(li.id); else ui.open.delete(li.id);
    store.set("open", [...ui.open]);
    updateToggleAll();
  }

  function visibleSkills() { return [...document.querySelectorAll(".skill")].filter((li) => !li.hidden); }
  function updateToggleAll() {
    const vis = visibleSkills();
    $("#toggleAll").textContent = vis.length && vis.every((li) => li.classList.contains("open")) ? "Collapse all" : "Expand all";
  }

  function applyFilters() {
    const q = ui.q.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll(".skill").forEach((li) => {
      let any = false;
      li.querySelectorAll(".method").forEach((m) => {
        const ok = ui.tiers.has(m.dataset.tier);
        m.hidden = !ok; if (ok) any = true;
      });
      const vis = any && (ui.group === "all" || li.dataset.group === ui.group) && (!q || li._text.includes(q));
      li.hidden = !vis;
      if (vis) shown++;
    });
    $("#noResults").hidden = shown > 0;
    updateToggleAll();
  }

  function bind() {
    let t;
    $("#search").addEventListener("input", (e) => {
      ui.q = e.target.value;
      clearTimeout(t);
      t = setTimeout(() => {
        applyFilters();
        // open the matches when the search is specific enough
        if (ui.q.trim().length >= 3) visibleSkills().slice(0, 3).forEach((li) => toggle(li, true));
      }, 120);
    });
    $("#toggleAll").addEventListener("click", () => {
      const vis = visibleSkills();
      const open = !vis.every((li) => li.classList.contains("open"));
      vis.forEach((li, i) => setTimeout(() => toggle(li, open), i * 30));
    });
    const openHash = () => {
      const li = location.hash && document.getElementById(location.hash.slice(1));
      if (!li || !li.classList.contains("skill")) return;
      toggle(li, true);
      const go = () => setTimeout(() => li.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go);
    };
    window.addEventListener("hashchange", openHash);
    openHash();
  }

  renderMeta();
  renderToolbar();
  renderSkills();
  document.querySelectorAll(".skill.open").forEach(stagger);
  applyFilters();
  bind();
})();
