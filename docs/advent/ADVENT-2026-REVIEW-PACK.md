# SourceView Together · Advent Journey 2026 · Review Pack
A single document for reviewing the Advent reading plan in the SourceView Together Bible app: what the app is, why it is built around stories, how the Advent plan was chosen and built, every story with its key Advent verse, how the plan behaves in the app, and the marketing made for it. It was assembled on 24 November 2026 from the app's shipping data (`assets/data/`), its code and the marketing files in the repository. Scripture quotations are from the Holy Bible, New Living Translation (NLT), as the app shows them.
**Reviewers:** a list of questions worth critiquing is at the end (section 9).
## 1. What SourceView Together is
SourceView Together is a free Bible app for iOS and Android (English NLT; French planned). Its distinctive idea is that **every word of the Bible is attributed to the voice that speaks it**, and shown in one of four colours:
| Colour | Voice | Examples |
| --- | --- | --- |
| Charcoal | Narrator | the voice that carries the story between speeches |
| Red | God (divine speech, including Jesus and the Holy Spirit) | God to Abraham, the words of Jesus |
| Green | Named principals | the people a story centres on: Abraham, Ruth, David, Isaiah |
| Blue | Everyone else | angels, shepherds, crowds, supporting voices |
Text is laid out like a conversation: narration and divine speech down one side, human voices down the other. The data attributes 747,039 words to 773 distinct speakers (769 excluding the four narration voices).
**Reading together is the core use.** Every story is split into **four reading parts**, one per colour. Four people (a family at the table, a small group, a class) each take a part and read it aloud. When a story has fewer kinds of voice, the app gives the busiest colour to more than one reader, so all four people still have a part. After each story, **Talk about it** offers four discussion questions for each of three audiences: family, school and small group. There are two sets per audience for most stories.
### Why 365 stories, and why plans are made of stories
The app divides the **whole Bible** (all 66 books, all 31,102 verses, Genesis 1:1 to Revelation 22:21 with no gaps) into **365 complete stories** (S001 to S365), grouped into 10 divisions (The Beginning, History, Wisdom, Major Prophets, Minor Prophets, Gospels, The Church Begins, Paul's Letters, Letters to Everyone, Revelation). Chapter divisions were added centuries after the text was written and often cut a scene in half. A story ends where the story ends, so a reading is always a complete arc. Each story takes 2 to 14 minutes to read silently (median 10), which makes one story a realistic daily unit. 365 stories also make "the Bible in a year, one story a day" literal.
Because the story is the unit, **every reading plan is a list of stories, not of chapters or verses**. A plan cannot point to a single verse: it points to the whole story that contains it. Curating a plan therefore means choosing the stories whose arc carries the theme. For Advent, the moment that matters (the "key verse" below) sits inside a longer reading, so readers meet each promise in its setting instead of as a stand-alone verse.
The app currently offers 15 catalogue plans, including Bible in 1 year (365), Bible in 1 School Year (180), New Testament in 100 days, Old and New Testament Journeys, The Gospels, Paul's Letters, Women of the Bible, David's Life, In the Beginning, God's Story (7), the Lenten Reflection, and three seasonal Christmas plans: **Advent Journey (26)**, 7 Days of Christmas and 12 Days of Christmas. Readers can also build their own plans and follow one voice through the Bible.
## 2. The Advent Journey at a glance
- **Plan id:** `adventJourneyChronological` · **Title:** Advent Journey · **Catalogue line:** "26 Stories - 4 Weeks"
- **Catalogue description (in the app):** "Read Advent the way the church has kept it for centuries. Week 1 traces God's promise through Jesus' family tree, week 2 listens to the prophets, and week 3 rejoices. From December 17 the ancient O Antiphons lead day by day to Christmas Eve. Sunday readings include the passage many churches read that day."
- **Dates in 2026:** Sunday 29 November (the first Sunday of Advent) to Thursday 24 December (Christmas Eve): 26 days, one story a day.
- **Size:** 26 stories, 52,144 words, 245 minutes of silent reading in total (the app's estimate; 9.4 min a day on average, range 5–13). Reading aloud takes noticeably longer.
- **Shape:** four weeks named for the four Advent candles, each with its own colour in the app:
  - **Week 1 · Hope** (#6A4C93): God's promise, from the first pages of Scripture to Isaiah's Immanuel
  - **Week 2 · Peace** (#3F6FB5): The prophets comfort God’s people and point to the Prince of Peace
  - **Week 3 · Joy** (#C2507A): Rejoice, the Lord is near. From Dec 17, the O Antiphons lead to Christmas
  - **Week 4 · Love** (#8E3FA0): God keeps his promise: Immanuel, God with us
- **Three threads run through it:**
  1. **The promise through the family line** (Week 1): from the first promise in Genesis 3 through Abraham, Ruth and David to Isaiah's Immanuel, following the people named in Matthew's genealogy.
  2. **The church's calendar:** the three later Sundays use the Revised Common Lectionary's Advent readings for Year B (Advent 2026): Isaiah 40 (6 Dec), Isaiah 61 (13 Dec) and 2 Samuel 7 (20 Dec). The first Sunday follows Advent 1's traditional theme of Christ's return. Joy week includes Philippians 4:4, the text Gaudete Sunday is named after.
  3. **The O Antiphons** (17–23 December): seven ancient titles for Christ, sung before the Magnificat in the last week of Advent since at least the 8th century, and the source of the carol "O Come, O Come, Emmanuel". Days 19–25 each read a story behind one antiphon: Wisdom, Lord, Root of Jesse, Key of David, Dayspring, King of the Nations, Emmanuel.
- **Order:** not Bible order. It runs from the end of the story (Revelation) back to the beginning (Genesis), forward through the prophets, and arrives at the manger on Christmas Eve.

## 3. The 26 stories
Minutes are the app's silent-reading estimate. "Voices" is the number of distinct speakers in the story. "Reading parts" are the four parts the app hands out (by colour).

| Day | Date | Week | Story | Reference | Min | Voices | Plan note (shown in the app) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Sun 29 Nov | Hope | The Holy City is Coming (S365) | Revelation 20:4-22:21 | 8 | 7 | Advent begins by looking ahead: Jesus will come again (chs. 21–22) |
| 2 | Mon 30 Nov | Hope | People Sin (S002) | Genesis 3:1-5:32 | 8 | 8 | The first promise of a Rescuer (3:15) |
| 3 | Tue 01 Dec | Hope | God Makes a Covenant with Abraham (S006) | Genesis 15:1-18:15 | 9 | 6 | Count the stars: God's promise to Abraham (15:5) |
| 4 | Wed 02 Dec | Hope | Abraham's Faith Tested (S008) | Genesis 20:1-23:20 | 10 | 10 | “God will provide” — Abraham and Isaac (ch. 22) |
| 5 | Thu 03 Dec | Hope | A Surprising Love Story (S085) | Ruth 1:1-4:22 | 11 | 10 | Bethlehem, and the family line of Jesse and David (4:17) |
| 6 | Fri 04 Dec | Hope | God Rejects Saul & Samuel Anoints David (S090) | 1 Samuel 15:1-16:23 | 7 | 10 | The Advent moment is in ch. 16: Samuel goes to Jesse in Bethlehem |
| 7 | Sat 05 Dec | Hope | Isaiah Volunteers; God Promises Emmanuel (S191) | Isaiah 6:1-9:7 | 8 | 7 | Immanuel, and “a child is born” (7:14; 9:6) |
| 8 | Sun 06 Dec | Peace | The Gospel Proclaimed; God & Idols Contrasted (S199) | Isaiah 40:1-41:29 | 7 | 5 | “Comfort, comfort my people” — read in many churches today |
| 9 | Mon 07 Dec | Peace | No God like Our God (S257) | Micah 4:9-7:20 | 8 | 4 | A ruler from Bethlehem who will be the source of peace (5:2–5) |
| 10 | Tue 08 Dec | Peace | First Servant Song; God & Idols Contrasted (S200) | Isaiah 42:1-44:23 | 10 | 3 | The gentle Servant who won't crush the weakest reed (42:1–4) |
| 11 | Wed 09 Dec | Peace | Two Servant Songs (S202) | Isaiah 49:1-52:12 | 10 | 4 | “How beautiful… the feet of the messenger” of peace (52:7) |
| 12 | Thu 10 Dec | Peace | A Final Servant Song - God's Way of Salvation (S203) | Isaiah 52:13-57:21 | 10 | 3 | The suffering Servant of Isaiah 53 |
| 13 | Fri 11 Dec | Peace | Letter to Exiles in Babylon: A New Covenant Promised (S215) | Jeremiah 29:1-31:40 | 12 | 3 | “A future and a hope”, and the new covenant (29:11; 31:31) |
| 14 | Sat 12 Dec | Peace | The Good Shepherd Restores His People (S238) | Ezekiel 34:1-36:38 | 11 | 2 | God himself will come and shepherd his sheep (34:11) |
| 15 | Sun 13 Dec | Joy | Preparing for God's Reign & Salvation (S204) | Isaiah 58:1-62:12 | 11 | 2 | Good news to the poor (61:1) — read in many churches today |
| 16 | Mon 14 Dec | Joy | From Gloom to Ecstasy (S260) | Zephaniah 1:1-3:20 | 7 | 4 | “He will rejoice over you with joyful songs” (3:17) |
| 17 | Tue 15 Dec | Joy | Book 4: God our King & Refuge (S172) | Psalms 90:1-100:5 | 11 | 4 | Psalm 98, the song behind “Joy to the World” |
| 18 | Wed 16 Dec | Joy | Rejoice! (S339) | Philippians 1:1-4:23 | 12 | 1 | “Rejoice!” — the verse Gaudete Sunday is named after (4:4) |
| 19 | Thu 17 Dec | Joy | God Came to Us (S298) | John 1:1-1:51 | 5 | 8 | O Antiphon · O Wisdom — the Word became human (1:14) |
| 20 | Fri 18 Dec | Joy | Israelites Enslaved & Moses Called (S019) | Exodus 1:1-4:31 | 12 | 11 | O Antiphon · O Lord — God speaks from the burning bush (ch. 3) |
| 21 | Sat 19 Dec | Joy | Judah's Enemies Judged; Emmanuel's Coming Reign (S192) | Isaiah 9:8-12:6 | 9 | 5 | O Antiphon · O Root of Jesse — a shoot from Jesse's stump (ch. 11) |
| 22 | Sun 20 Dec | Love | God Makes a Covenant with David (S098) | 2 Samuel 6:1-7:29 | 7 | 6 | O Antiphon · O Key of David — a throne forever (7:16) · read in many churches today |
| 23 | Mon 21 Dec | Love | Crucial Questions for Spiritual Leaders (S265) | Malachi 1:1-4:6 | 9 | 4 | O Antiphon · O Dayspring — “the Sun of Righteousness will rise” (4:2) |
| 24 | Tue 22 Dec | Love | The Coming Shepherd King (S264) | Zechariah 9:1-14:21 | 13 | 3 | O Antiphon · O King of the Nations — “your king is coming” (9:9) |
| 25 | Wed 23 Dec | Love | The Kingdom is Inaugurated (S266) | Matthew 1:1-4:25 | 10 | 9 | O Antiphon · O Emmanuel — “God is with us” (1:23) |
| 26 | Thu 24 Dec | Love | Two Miraculous Births (S285) | Luke 1:1-2:40 | 10 | 11 | Christmas Eve — “The Savior… has been born today in Bethlehem” (2:11) |

### Each story, why it was chosen, and its key Advent verse

#### Week 1 · Hope — God's promise, from the first pages of Scripture to Isaiah's Immanuel

**Day 1 · Sun 29 Nov · The Holy City is Coming** · Revelation 20:4-22:21 · 8 min · story S365

- *Plan note:* Advent begins by looking ahead: Jesus will come again (chs. 21–22)
- *Why this story:* Advent's first Sunday has always looked to Christ's second coming (the lectionary's first-Sunday readings are about his return). Starting on the Bible's last pages says Advent waits for both comings: the one at Christmas and the one still to come. Revelation 22 ends with the Bible's last prayer, "Come, Lord Jesus!"
- *Key verse, Revelation 22:20 (NLT):* He who is the faithful witness to all these things says, “Yes, I am coming soon!” Amen! Come, Lord Jesus!
- *Reading parts:* black, black, red, blue · *Family question 1:* What pictures of the new creation moved you?

**Day 2 · Mon 30 Nov · People Sin** · Genesis 3:1-5:32 · 8 min · story S002

- *Plan note:* The first promise of a Rescuer (3:15)
- *Why this story:* Where the need for a rescuer begins. Genesis 3:15 is traditionally read as the first promise of the Messiah (the protoevangelium): the woman's offspring will strike the serpent's head.
- *Key verse, Genesis 3:15 (NLT):* And I will cause hostility between you and the woman, and between your offspring and her offspring. He will strike your head, and you will strike his heel.”
- *Reading parts:* black, black, red, blue · *Family question 1:* What happened in the garden in this story?

**Day 3 · Tue 01 Dec · God Makes a Covenant with Abraham** · Genesis 15:1-18:15 · 9 min · story S006

- *Plan note:* Count the stars: God's promise to Abraham (15:5)
- *Why this story:* God's covenant with Abraham and the promise of descendants as many as the stars. Matthew's genealogy of Jesus begins with Abraham (Matthew 1:1-2), and Paul calls Jesus the promised "seed" (Galatians 3:16).
- *Key verse, Genesis 15:5 (NLT):* Then the Lord took Abram outside and said to him, “Look up into the sky and count the stars if you can. That’s how many descendants you will have!”
- *Reading parts:* black, red, green, blue · *Family question 1:* What promise did God give Abram?

**Day 4 · Wed 02 Dec · Abraham's Faith Tested** · Genesis 20:1-23:20 · 10 min · story S008

- *Plan note:* “God will provide” — Abraham and Isaac (ch. 22)
- *Why this story:* The binding of Isaac: "God will provide" a lamb. Christians have long read it as a picture of the Father giving his Son. Isaac is the promised child through whom the line continues.
- *Key verse, Genesis 22:8 (NLT):* “God will provide a sheep for the burnt offering, my son,” Abraham answered. And they both walked on together.
- *Reading parts:* black, red, green, blue · *Family question 1:* What hard test did Abraham face?

**Day 5 · Thu 03 Dec · A Surprising Love Story** · Ruth 1:1-4:22 · 11 min · story S085

- *Plan note:* Bethlehem, and the family line of Jesse and David (4:17)
- *Why this story:* The plan arrives in Bethlehem. Ruth, a foreigner, becomes great-grandmother of David and is named in Jesus' genealogy (Matthew 1:5). Ruth 4:17 traces the family line Obed, Jesse, David.
- *Key verse, Ruth 4:17 (NLT):* The neighbor women said, “Now at last Naomi has a son again!” And they named him Obed. He became the father of Jesse and the grandfather of David.
- *Reading parts:* black, green, blue, black · *Family question 1:* What choices by Ruth or Boaz stood out?

**Day 6 · Fri 04 Dec · God Rejects Saul & Samuel Anoints David** · 1 Samuel 15:1-16:23 · 7 min · story S090

- *Plan note:* The Advent moment is in ch. 16: Samuel goes to Jesse in Bethlehem
- *Why this story:* Samuel is sent to Jesse's family in Bethlehem to anoint a new king; the youngest son, David, a shepherd, is chosen. "Messiah" and "Christ" both mean "anointed one", and Jesus is called the son of David.
- *Key verse, 1 Samuel 16:1 (NLT):* Now the Lord said to Samuel, “You have mourned long enough for Saul. I have rejected him as king of Israel, so fill your flask with olive oil and go to Bethlehem. Find a man named Jesse who lives there, for I have selected one of his sons to be my king.”
- *Reading parts:* black, red, green, blue · *Family question 1:* What contrasts did you see between Saul and David?

**Day 7 · Sat 05 Dec · Isaiah Volunteers; God Promises Emmanuel** · Isaiah 6:1-9:7 · 8 min · story S191

- *Plan note:* Immanuel, and “a child is born” (7:14; 9:6)
- *Why this story:* Week 1 ends with the promise given a name: the Immanuel sign (Isaiah 7:14, quoted in Matthew 1:23) and "For a child is born to us" (Isaiah 9:6), read at Christmas services worldwide.
- *Key verse, Isaiah 7:14 (NLT):* All right then, the Lord himself will give you the sign. Look! The virgin will conceive a child! She will give birth to a son and will call him Immanuel (which means ‘God is with us’).
- *Key verse, Isaiah 9:6 (NLT):* For a child is born to us, a son is given to us. The government will rest on his shoulders. And he will be called: Wonderful Counselor, Mighty God, Everlasting Father, Prince of Peace.
- *Reading parts:* black, red, green, blue · *Family question 1:* What part of Isaiah’s vision stood out?

#### Week 2 · Peace — The prophets comfort God’s people and point to the Prince of Peace

**Day 8 · Sun 06 Dec · The Gospel Proclaimed; God & Idols Contrasted** · Isaiah 40:1-41:29 · 7 min · story S199

- *Plan note:* “Comfort, comfort my people” — read in many churches today
- *Why this story:* Second Sunday of Advent. Isaiah 40:1-11 is the Revised Common Lectionary reading for Advent 2 in Year B (Advent 2026). "Comfort, comfort my people" opens the second half of Isaiah, and the voice crying in the wilderness (40:3) is applied to John the Baptist in all four Gospels.
- *Key verse, Isaiah 40:1 (NLT):* “Comfort, comfort my people,” says your God.
- *Key verse, Isaiah 40:3 (NLT):* Listen! It’s the voice of someone shouting, “Clear the way through the wildernessfor the Lord! Make a straight highway through the wastelandfor our God!
- *Reading parts:* black, red, green, blue · *Family question 1:* What images of God’s power stood out?

**Day 9 · Mon 07 Dec · No God like Our God** · Micah 4:9-7:20 · 8 min · story S257

- *Plan note:* A ruler from Bethlehem who will be the source of peace (5:2–5)
- *Why this story:* Micah names Bethlehem as the birthplace of a ruler "whose origins are in the distant past" (5:2, quoted to Herod in Matthew 2:6) who "will be the source of peace" (5:5): the Peace week in one passage.
- *Key verse, Micah 5:2 (NLT):* But you, O Bethlehem Ephrathah, are only a small village among all the people of Judah. Yet a ruler of Israel, whose origins are in the distant past, will come from you on my behalf.
- *Reading parts:* black, black, red, blue · *Family question 1:* What laments and promises were together?

**Day 10 · Tue 08 Dec · First Servant Song; God & Idols Contrasted** · Isaiah 42:1-44:23 · 10 min · story S200

- *Plan note:* The gentle Servant who won't crush the weakest reed (42:1–4)
- *Why this story:* The first Servant Song (Isaiah 42:1-4), quoted of Jesus in Matthew 12:18-21: a gentle Servant who "will not crush the weakest reed". Peace that comes without violence.
- *Key verse, Isaiah 42:3 (NLT):* He will not crush the weakest reedor put out a flickering candle. He will bring justice to all who have been wronged.
- *Reading parts:* black, red, red, blue · *Family question 1:* What marks the Servant’s mission?

**Day 11 · Wed 09 Dec · Two Servant Songs** · Isaiah 49:1-52:12 · 10 min · story S202

- *Plan note:* “How beautiful… the feet of the messenger” of peace (52:7)
- *Why this story:* "How beautiful... are the feet of the messenger who brings good news" (52:7), the good news of peace; Paul quotes it of the gospel in Romans 10:15.
- *Key verse, Isaiah 52:7 (NLT):* How beautiful on the mountainsare the feet of the messenger who brings good news, the good news of peace and salvation, the news that the God of Israel reigns!
- *Reading parts:* black, red, green, blue · *Family question 1:* What roles of the Servant are highlighted?

**Day 12 · Thu 10 Dec · A Final Servant Song - God's Way of Salvation** · Isaiah 52:13-57:21 · 10 min · story S203

- *Plan note:* The suffering Servant of Isaiah 53
- *Why this story:* The fourth Servant Song (Isaiah 52:13-53:12), the suffering Servant. Advent reads the manger in the light of the cross; this is the most quoted Old Testament passage in the New Testament's account of Jesus' death.
- *Key verse, Isaiah 53:5 (NLT):* But he was pierced for our rebellion, crushed for our sins. He was beaten so we could be whole. He was whipped so we could be healed.
- *Reading parts:* black, red, red, blue · *Family question 1:* What suffering and victory are described?

**Day 13 · Fri 11 Dec · Letter to Exiles in Babylon: A New Covenant Promised** · Jeremiah 29:1-31:40 · 12 min · story S215

- *Plan note:* “A future and a hope”, and the new covenant (29:11; 31:31)
- *Why this story:* Jeremiah's letter to the exiles: "a future and a hope" (29:11), read here in its real setting, and the promise of a new covenant written on hearts (31:31-34), which Hebrews 8 quotes in full.
- *Key verse, Jeremiah 29:11 (NLT):* “For I know the plans I have for you,” says the Lord. “They are plans for good and not for disaster, to give you a future and a hope.
- *Key verse, Jeremiah 31:33 (NLT):* “But this is the new covenant I will make with the people of Israel after those days,” says the Lord. “I will put my instructions deep within them, and I will write them on their hearts. I will be their God, and they will be my people.
- *Reading parts:* black, red, red, green · *Family question 1:* What hope was given to the exiles?

**Day 14 · Sat 12 Dec · The Good Shepherd Restores His People** · Ezekiel 34:1-36:38 · 11 min · story S238

- *Plan note:* God himself will come and shepherd his sheep (34:11)
- *Why this story:* God promises to shepherd his scattered people himself ("I myself will search and find my sheep", 34:11) and to raise up a shepherd from David's line (34:23). It prepares for the shepherds of Luke 2 and for Jesus as the Good Shepherd (John 10).
- *Key verse, Ezekiel 34:11 (NLT):* “For this is what the Sovereign Lord says: I myself will search and find my sheep.
- *Reading parts:* black, red, red, red · *Family question 1:* What shepherd images showed God’s care?

#### Week 3 · Joy — Rejoice, the Lord is near. From Dec 17, the O Antiphons lead to Christmas

**Day 15 · Sun 13 Dec · Preparing for God's Reign & Salvation** · Isaiah 58:1-62:12 · 11 min · story S204

- *Plan note:* Good news to the poor (61:1) — read in many churches today
- *Why this story:* Third Sunday of Advent. Isaiah 61:1-4, 8-11 is the Revised Common Lectionary reading for Advent 3 in Year B. Jesus reads Isaiah 61:1 aloud in the synagogue at Nazareth and says it is fulfilled (Luke 4:18-21).
- *Key verse, Isaiah 61:1 (NLT):* The Spirit of the Sovereign Lord is upon me, for the Lord has anointed meto bring good news to the poor. He has sent me to comfort the brokenheartedand to proclaim that captives will be releasedand prisoners will be freed.
- *Reading parts:* black, red, red, red · *Family question 1:* What kind of fasting and justice does God want?

**Day 16 · Mon 14 Dec · From Gloom to Ecstasy** · Zephaniah 1:1-3:20 · 7 min · story S260

- *Plan note:* “He will rejoice over you with joyful songs” (3:17)
- *Why this story:* Joy week. Zephaniah moves from judgement to joy: God "will rejoice over you with joyful songs" (3:17). Zephaniah 3:14-20 is a lectionary reading for the third Sunday of Advent (Year C).
- *Key verse, Zephaniah 3:17 (NLT):* For the Lord your God is living among you. He is a mighty savior. He will take delight in you with gladness. With his love, he will calm all your fears. He will rejoice over you with joyful songs.”
- *Reading parts:* black, red, green, blue · *Family question 1:* What warnings and songs appeared?

**Day 17 · Tue 15 Dec · Book 4: God our King & Refuge** · Psalms 90:1-100:5 · 11 min · story S172

- *Plan note:* Psalm 98, the song behind “Joy to the World”
- *Why this story:* Psalm 98, which Isaac Watts paraphrased as "Joy to the World" (1719): the whole earth sings because the Lord comes. The story spans Psalms 90-100, the psalms of God as King.
- *Key verse, Psalms 98:4 (NLT):* Shout to the Lord, all the earth; break out in praise and sing for joy!
- *Reading parts:* black, green, blue, blue · *Family question 1:* What calls to worship and trust did you hear?

**Day 18 · Wed 16 Dec · Rejoice!** · Philippians 1:1-4:23 · 12 min · story S339

- *Plan note:* “Rejoice!” — the verse Gaudete Sunday is named after (4:4)
- *Why this story:* Philippians, the letter of joy. The third Sunday of Advent is called Gaudete ("Rejoice!") Sunday after the Latin opening of its liturgy, taken from Philippians 4:4-5: "Rejoice in the Lord always... The Lord is near."
- *Key verse, Philippians 4:4 (NLT):* Always be full of joy in the Lord. I say it again—rejoice!
- *Reading parts:* black, black, black, black · *Family question 1:* What themes of joy and unity appeared?

**Day 19 · Thu 17 Dec · God Came to Us** · John 1:1-1:51 · 5 min · story S298

- *Plan note:* O Antiphon · O Wisdom — the Word became human (1:14)
- *Why this story:* First O Antiphon (17 December), O Sapientia, "O Wisdom". John 1 presents Jesus as the eternal Word through whom all things were made, who "became human and made his home among us" (1:14).
- *Key verse, John 1:14 (NLT):* So the Word became human and made his home among us. He was full of unfailing love and faithfulness. And we have seen his glory, the glory of the Father’s one and only Son.
- *Reading parts:* black, red, green, blue · *Family question 1:* What titles or images describe Jesus?

**Day 20 · Fri 18 Dec · Israelites Enslaved & Moses Called** · Exodus 1:1-4:31 · 12 min · story S019

- *Plan note:* O Antiphon · O Lord — God speaks from the burning bush (ch. 3)
- *Why this story:* Second O Antiphon (18 December), O Adonai, "O Lord... who appeared to Moses in the fire of the burning bush". Exodus 3: God hears his people's cry, comes down to rescue, and reveals his name.
- *Key verse, Exodus 3:14 (NLT):* God replied to Moses, “I Am Who I Am. Say this to the people of Israel: I Am has sent me to you.”
- *Reading parts:* black, red, green, blue · *Family question 1:* What hard things happened to God’s people?

**Day 21 · Sat 19 Dec · Judah's Enemies Judged; Emmanuel's Coming Reign** · Isaiah 9:8-12:6 · 9 min · story S192

- *Plan note:* O Antiphon · O Root of Jesse — a shoot from Jesse's stump (ch. 11)
- *Why this story:* Third O Antiphon (19 December), O Radix Jesse, "O Root of Jesse": "Out of the stump of David's family will grow a shoot" (Isaiah 11:1).
- *Key verse, Isaiah 11:1 (NLT):* Out of the stump of David’s family will grow a shoot—yes, a new Branch bearing fruit from the old root.
- *Reading parts:* black, black, red, blue · *Family question 1:* What warnings and promises did you notice?

#### Week 4 · Love — God keeps his promise: Immanuel, God with us

**Day 22 · Sun 20 Dec · God Makes a Covenant with David** · 2 Samuel 6:1-7:29 · 7 min · story S098

- *Plan note:* O Antiphon · O Key of David — a throne forever (7:16) · read in many churches today
- *Why this story:* Fourth Sunday of Advent and the fourth O Antiphon (20 December), O Clavis David, "O Key of David". 2 Samuel 7:1-11, 16 is the Revised Common Lectionary reading for Advent 4 in Year B: God promises David a throne forever (7:16), which the angel echoes to Mary (Luke 1:32-33).
- *Key verse, 2 Samuel 7:16 (NLT):* Your house and your kingdom will continue before me for all time, and your throne will be secure forever.’”
- *Reading parts:* black, red, green, blue · *Family question 1:* What promises stood out to you?

**Day 23 · Mon 21 Dec · Crucial Questions for Spiritual Leaders** · Malachi 1:1-4:6 · 9 min · story S265

- *Plan note:* O Antiphon · O Dayspring — “the Sun of Righteousness will rise” (4:2)
- *Why this story:* Fifth O Antiphon (21 December, the longest night), O Oriens, "O Dayspring": "the Sun of Righteousness will rise with healing in his wings" (4:2). Malachi is the last book of the Old Testament and ends by promising Elijah's return, which the Gospels apply to John the Baptist.
- *Key verse, Malachi 4:2 (NLT):* “But for you who fear my name, the Sun of Righteousness will rise with healing in his wings. And you will go free, leaping with joy like calves let out to pasture.
- *Reading parts:* black, red, red, blue · *Family question 1:* What questions did God raise with His people?

**Day 24 · Tue 22 Dec · The Coming Shepherd King** · Zechariah 9:1-14:21 · 13 min · story S264

- *Plan note:* O Antiphon · O King of the Nations — “your king is coming” (9:9)
- *Why this story:* Sixth O Antiphon (22 December), O Rex Gentium, "O King of the nations": "Look, your king is coming to you... riding on a donkey" (9:9), quoted at Jesus' entry into Jerusalem, and "the Lord will be king over all the earth" (14:9).
- *Key verse, Zechariah 9:9 (NLT):* Rejoice, O people of Zion! Shout in triumph, O people of Jerusalem! Look, your king is coming to you. He is righteous and victorious, yet he is humble, riding on a donkey—riding on a donkey’s colt.
- *Reading parts:* black, black, red, green · *Family question 1:* What do these chapters say about the coming King?

**Day 25 · Wed 23 Dec · The Kingdom is Inaugurated** · Matthew 1:1-4:25 · 10 min · story S266

- *Plan note:* O Antiphon · O Emmanuel — “God is with us” (1:23)
- *Why this story:* Seventh O Antiphon (23 December), O Emmanuel, "God with us". Matthew 1-4: Jesus' genealogy, his birth, the wise men and the star, and the quotation of Isaiah 7:14 that names him Immanuel (1:23).
- *Key verse, Matthew 1:23 (NLT):* “Look! The virgin will conceive a child! She will give birth to a son, and they will call him Immanuel, which means ‘God is with us.’”
- *Reading parts:* black, black, red, blue · *Family question 1:* What beginnings of the kingdom did you see?

**Day 26 · Thu 24 Dec · Two Miraculous Births** · Luke 1:1-2:40 · 10 min · story S285

- *Plan note:* Christmas Eve — “The Savior… has been born today in Bethlehem” (2:11)
- *Why this story:* Christmas Eve. Luke 1:1-2:40: the angel's announcements to Zechariah and Mary, the births of John and Jesus, the shepherds and the angels' song, and Simeon and Anna in the Temple. "The Savior... has been born today in Bethlehem" (2:11).
- *Key verse, Luke 2:11 (NLT):* The Savior—yes, the Messiah, the Lord—has been born today in Bethlehem, the city of David!
- *Reading parts:* black, black, black, blue · *Family question 1:* What surprises filled these birth stories?

## 4. How the plan was created
The plan data lives in `assets/data/ChronologicalMappings.json` under `adventJourneyChronological`: an ordered list of 26 stories, each with its week (`phase`) and a one-line day note in English and French, plus the four weeks' titles, descriptions and colours. The catalogue entry (title, short and long description) is in `assets/data/ReadingPlansChallenges.json`.
History, from the repository:
- An earlier Advent plan existed from 2025 as a generic chronological selection.
- **17 November 2026:** the plan was rebuilt from scratch (commit `d799eb4`, "Rebuild Advent and Christmas plans"). The rebuild set the 26-day length to match Advent 2026 exactly. It chose the stories around the three threads above (the promise through the family line, the Year B lectionary Sundays, and the O Antiphons in the last week), and wrote a day note for each story that points to the moment that makes it an Advent reading. The 7 Days and 12 Days of Christmas plans were rebuilt alongside it.
- The same day: day notes and dates were added to seasonal plans; the Advent invitation card and Advent reminders were added (`2d647c3`); and tests were added for the season dates, the reminders and every plan's story references (`2afe58c`). An over-the-air update named "Advent 2026" was published to the live 2.0.0 app builds.
- **17–20 November 2026:** follow-up work for Advent readers. The plan page lists stories in plan order. The reader's next and previous arrows follow the plan order. Plan reads count towards progress. There is a forgiving streak and reminders that name the day's story.
The plan was curated with an AI coding assistant (Claude) working in this repository, from the brief: one complete story a day to Christmas Eve, the shape of the church's Advent, readable aloud by families and small groups. Every story id, reference and day note is checked by automated tests against the app's Bible data.

## 5. How the plan works in the app
- **Dated, not just ordered.** The app works out the first Sunday of Advent each year (the fourth Sunday before Christmas Day) and runs the plan to 24 December. Day labels such as "Day 5 · Thu, Dec 3" appear only when the year's Advent has exactly as many days as the plan has stories, so a list written for 26 days is never silently mis-dated in a year when Advent is 22–28 days long (`utils/seasonalPlans.ts`).
- **When it is offered:** in the catalogue from 1 November to 24 December. Started plans stay visible.
- **Invitation card** on the Read and Plan tabs from November until Christmas Eve, for readers who haven't joined (`components/thread/AdventInvite.tsx`). Before Advent it reads "Advent begins {{date}}" / "26 days from promise to manger, one story a day to Christmas Eve. About 10 minutes a day." with **Join Advent**, **Remind me** and **See the plan**. After joining it shows "Starts {{date}}". During Advent it reads "Advent · Day {{n}} is today".
- **Joining late:** "Advent began {{date}}" / "Start with today's reading (Day {{n}}), or start from Day 1 and catch up?" The reader chooses **Today's reading** or **From Day 1**, so nobody starts the season behind.
- **The plan page** shows the four weeks in their colours, each day with its date, reference, reading time and day note, in plan order. Finished days are ticked and "up next" is the next unread day.
- **Reading:** opening a day from the plan opens the full story in the voice-coloured reader with the four reading parts. The next and previous arrows follow the plan's order rather than Bible order. "Talk about it" questions follow every story.
- **Reminders (local notifications, on the device only; `utils/adventReminders.ts`, `utils/reminderPlan.ts`):**
  - Not joined, daily reminders on: "Advent starts next Sunday" (Sunday before), "Advent starts tomorrow" (Saturday before), and "It's not too late to join Advent" (second Sunday).
  - Tapped Remind me: "starts tomorrow", "Advent begins today" and "not too late".
  - Joined: the evening before Day 1, "Day 1 is ready: {{title}}". With daily reminders on, each day's reminder names that day's story. With them off, a reminder each Advent Sunday ("{{week}} begins") and on Christmas Eve.
  - Paused or finished plans get nothing.
- **Streak:** a forgiving daily streak with up to 2 rest days (one earned per 7 reads), a weekly goal of 3, 5 or 7 readings, and milestones at 3, 7, 14, 30, 50, 100, 200 and 365 days (`utils/streak.ts`). Missing a day does not reset progress through the plan.
- **Privacy:** no accounts or sign-in. Progress, reminders and notes stay on the device.

## 6. Brand and look
- **App palette:** background #F3F5F2, ink #101619; voice colours narrator #3A4550, God #C0261A, principals #0E6B4C, everyone else #1D46A8 (dark-mode versions #AEBACB, #FF5A45, #46D9A0, #6BA9FF).
- **Advent week colours:** Hope #6A4C93, Peace #3F6FB5, Joy #C2507A, Love #8E3FA0.
- **Type:** the system sans (San Francisco or Inter) in the app. Marketing films use Instrument Serif for display lines.
- **Voice of the copy:** British spelling, plain and warm, no hype. Rules: no line asserts the viewer's religion (Meta advertising policy), Scripture is quoted word for word with its reference, nothing AI-generated in images or voices, and nothing the app doesn't do is advertised (no audio, accounts or online group sessions).
- **Music:** original arrangements of public-domain melodies, written in code: "O Come, O Come, Emmanuel" (three versions), Silent Night, Joy to the World, Deck the Halls, We Three Kings.

## 7. Marketing made for Advent 2026
### Print
**Advent flyer for churches** (two A4 pages, `Marketing/print/advent-flyer-churches.pdf`). Headline: "Four voices. Ten minutes. One story a day to Christmas Eve." It explains the four parts and colours and two settings (families around the table, small groups in fours), lists the key dates (29 Nov Hope, 6 Dec Peace, 13 Dec Joy, 20 Dec Love, 24 Dec Christmas Eve) and how to join, and page 2 lists all 26 days.
### Video ads (30 s, 9:16, `Marketing/ads/out/`)
First wave (copy in `Marketing/ads/ADVENT.md`):
1. **AdventFamilyAd** (families). Hook: "Advent starts Sunday, 29 November." / "Read it together, out loud." The Plan tab and a tap on Join Advent lead to Day 1 (The Holy City is Coming) with Dad, Mum, Gran and Ana taking the four parts. Ends: "Ten minutes after dinner, every night to Christmas Eve." / "Four questions for families follow every story." Music: a bright arrangement of O Come, O Come, Emmanuel.
2. **AdventFamily3DAd** (families). The same story, with a 3D felt-style family of four (rendered in Blender, not AI) around an Advent wreath, a camera push into the phone, and the four candles lighting. Music: music-box O Come, O Come, Emmanuel.
3. **AdventGroupsAd** (churches and small groups). Hook: "From promise to manger in 26 days." / "Read it in fours, out loud." It shows Isaiah 6 read by four people, then the whole four-week journey. Ends: "Split into fours. Take a part. Read it out loud." Music: piano and cello.
Second wave (copy in `Marketing/ads/ADVENT26.md`). These are first versions: a list of improvements is awaiting approval, see section 8.
4. **Advent Starts in the Dark.** Lines appear only where candlelight reaches them: Isaiah 9:2, Revelation 21:4 and John 1:5. Then the four candles light and the film ends on Day 1 in the app. Music: Silent Night.
5. **Heavy Words.** Hope, Peace, Joy and Love appear in shop-window costumes (wrapping paper, neon, a sale banner, a greeting card) that fall away, leaving each word with a verse from its week. Music: Joy to the World.
6. **Come Home to the Story.** A family group chat about coming home for Christmas and doing the Advent readings turns into the app's four parts on Christmas Eve's story. Music: Deck the Halls, lo-fi.
7. **Count the Stars.** The plan's 26 days light up as stars, from God telling Abraham to count the stars (Day 3) to the wise men's star (Day 25). Music: We Three Kings.
### Ad copy (Meta)
- Families: "One Bible story a day from 29 November to Christmas Eve, read out loud as a family. SourceView Together splits every story into four colour-coded parts, so a child can read the angel while a grandparent narrates — about ten minutes after dinner, with four questions to talk over." Headline: Advent, read aloud as a family.
- Churches: "26 stories from the first promise to the manger, one a day through Advent. Every story in SourceView Together has four reading parts, so a small group can split into fours and read it out loud — and on three Sundays the story holds the passage many churches read that day." Headline: Advent in fours, out loud.
- Second-wave headlines: Advent starts in the dark · Give the words their weight back · Come home to the story · It started under these stars.
### Facebook posts (organic; download links go in the first comment)
- **Felt family video:** "Advent starts Sunday, 29 November. This year, read it together, out loud. SourceView Together has an Advent plan with one Bible story a day, all the way to Christmas Eve. Every story is split into four colour-coded parts, so everyone at the table gets a turn: Mum and Dad share the narration, someone reads God's words, and the youngest can read the angel. About ten minutes after dinner, four questions to talk over, and a candle for each week: Hope, Peace, Joy, Love. How does your family mark Advent? Tell us below."
- **Family how-to video:** "Advent starts this Sunday. Here's a ten-minute way to do it together. 1. Open SourceView Together and tap Join Advent on the Plan tab. 2. Pick a part each. There are four, colour-coded. 3. Read the day's story out loud, then talk through the four questions. 26 stories, from the first promise to the manger, one a day to Christmas Eve. Day 1 is 'The Holy City is Coming'. Advent begins by looking ahead. Starting late? The plan picks up at today's story, so no one has to catch up."
- **Churches video:** "From promise to manger in 26 days: a ready-made Advent plan for small groups. SourceView Together has an Advent reading plan of 26 Bible stories, one a day from 29 November to Christmas Eve. Every story has four colour-coded reading parts, so a group can split into fours and read it out loud, with questions to discuss after every story. The four weeks follow Hope, Peace, Joy and Love, and on three of the Sundays the story holds the passage many churches read that day. Leading a group this Advent? Share this with your team."

## 8. Known issues and open decisions
- **Reading time.** The app's minutes are silent-reading estimates (about 213 words a minute). Read aloud, which is the app's main use, the stories take longer. Some marketing and in-app text says "about 10 minutes a day" (the Advent card, the reminder, the flyer and the first-wave ads). The newest films avoid time claims. The general app description says 15–20 minutes per story. These should be made consistent.
- **Advent length.** Advent is 22 to 28 days depending on the year. The plan has 26 stories, matching 2026 only; in other years day labels switch off rather than mis-date. A plan for other years needs a rule for which stories to drop or add.
- **Whole stories are long.** Some days read far more than the Advent moment itself (for example, Exodus 1–4 for the burning bush, or Luke 1:1–2:40 on Christmas Eve). This is by design (story units), but it makes some days heavy.
- **Lectionary.** The Sunday alignment is to the Revised Common Lectionary Year B. Churches on other lectionaries (Catholic, Anglican or Orthodox variants) will see partial matches.
- **Second-wave films:** under revision. A campaign line ("Make room.") and production upgrades are proposed but not yet approved.

## 9. Questions for reviewers
1. Does the selection tell one coherent story from promise to fulfilment? Which day is the weakest link, and what would you replace it with (whole stories only, S001–S365)?
2. Is starting with Revelation on Day 1 right for a general audience, or confusing?
3. Is the balance right: Old and New Testament, prophets, narrative, poetry, and voices (for example, women's voices: Ruth, Mary, Elizabeth, Anna)?
4. Do the four weeks (Hope, Peace, Joy, Love) match their stories, especially Week 4 · Love?
5. Are the "why" explanations and key verses accurate and fair to the texts?
6. For families with children, and for small groups that are new to the Bible: which days are hard to read aloud or to discuss?
7. Does the marketing describe the plan accurately? Are any claims overstated?
8. What would make the plan more engaging day to day? For example, plan-specific discussion questions that appear only when the story is read inside the Advent plan.
