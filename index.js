const aspectToClass = {
  "1:1": "grid-item-1-1",
  "1:2": "grid-item-1-2",
  "1:3": "grid-item-1-3",
  "1:4": "grid-item-1-4",
  "2:1": "grid-item-2-1",
  "2:2": "grid-item-2-2",
  "2:3": "grid-item-2-3",
  "2:4": "grid-item-2-4",
  "3:1": "grid-item-3-1",
  "3:2": "grid-item-3-2",
  "3:3": "grid-item-3-3",
  "3:4": "grid-item-3-4",
  "4:1": "grid-item-4-1",
  "4:2": "grid-item-4-2",
  "4:3": "grid-item-4-3",
  "4:4": "grid-item-4-4",
};

const aspectToSpan = {
  "1:1": { cols: 1, rows: 1 },
  "1:2": { cols: 1, rows: 2 },
  "1:3": { cols: 1, rows: 3 },
  "1:4": { cols: 1, rows: 4 },
  "2:1": { cols: 2, rows: 1 },
  "2:2": { cols: 2, rows: 2 },
  "2:3": { cols: 2, rows: 3 },
  "2:4": { cols: 2, rows: 4 },
  "3:1": { cols: 3, rows: 1 },
  "3:2": { cols: 3, rows: 2 },
  "3:3": { cols: 3, rows: 3 },
  "3:4": { cols: 3, rows: 4 },
  "4:1": { cols: 4, rows: 1 },
  "4:2": { cols: 4, rows: 2 },
  "4:3": { cols: 4, rows: 3 },
  "4:4": { cols: 4, rows: 4 },
};

const imageFiles = [
  {
    src: "5.30.24.png",
    aspect: "1:1",
    description: "Decided to start building my portfolio, so ill make a mockup every day until I get bored I guess lol",
  },
  {
    src: "5.31.24.png",
    aspect: "2:1",
    description:
      "While not the best, I'd say this is a good improvement on the current site that https://www.ttgmi.com/index.htm currently has, would love to see a redesign!",
  },
  {
    src: "6.1.24.png",
    aspect: "1:1",
    description:
      "I always had the idea for iPhones without the dynamic island, to incorporate all the live activities into the home bar instead. Possibly good, possibly bad, not sure but 100% a concept for now.",
  },
  {
    src: "6.2.24.png",
    aspect: "2:1",
    description: "Another idea, have a button in an app transform to display data or any information that might be useful!",
  },
  { src: "6.3.24.png", aspect: "2:1", description: "Not done with today's design since alot has been happening, but I do have something to show that ill finish tomorrow! You may or may not notice a theme throughout this... lol" },
  { src: "6.4.24.png", aspect: "1:1", description: "Finished the smart home concept that I started yesterday, I couldn't find a spot to fit text on the laundry section and the TV, so I tried to make them look as fitting as possible" },
  { src: "6.5.24.png", aspect: "1:1", description: "A video editing platform, could use some work but its a good base to start on. Mabye I'll revisit this in the future and improve it. It looks pretty bare lol" },
  { src: "6.7.24.png", aspect: "2:2", description: "Yesterday was my graduation, tomorrow is my birthday, and today I had time to make another mockup\!\nThis time, in honor of (supposedly) a collaboration between OpenAI and Apple at the WWDC event (June 13th), I've made a concept of a home screen button being changed into a GPT Launcher\!\n(also I had to use the 15 pro and not pro max because that's the only native lockscreen mockup Apple has on figma lol)" },
  { src: "6.9.24.png", aspect: "2:1", description: "Well, the event is tomorrow! Based on what gets announced, ill make a concept UI, or replicate one from the event. For now, this is the final idea I had for this. \n\nAlso yes, I did have a fun birthday." },
  { src: "6.11.24.png", aspect: "2:1", description: "Well, WWDC24 was yesterday and they introduced a lot of features, including many features that already existed on android, as well as a ton of useful AI features (called apple intelligence, of course, because why would they NOT rename it?) and I wanted to recreate the control center. I am pretty busy but I will try and recreate it as well as I can!" },
  { src: "6.12.24.png", aspect: "2:1", description: "Getting San Fransisco icons is hard, especially because in order to access the official icons, you need a mac, how fitting. Anyway, it took some time to recreate part of the new control center!" },
  { src: "6.13.24.png", aspect: "2:1", description: "Making the video player more minimal, less obtrusive when it pops up!" },
  { src: "9.18.24.png", aspect: "2:1", description: "Recently got interested in linux and custom distros, mabye even making my own. Started making a mockup, and its looking good so far!" },
];

document.addEventListener("DOMContentLoaded", function () {
  const body = document.body;
  imageFiles.forEach((image) => {
    const klass = aspectToClass[image.aspect] || aspectToClass["1:1"];
    const img = document.createElement("img");
    img.className = klass;
    img.src = `Images/${image.src}`;
    img.alt = image.src;
    body.appendChild(img);
  });
});
