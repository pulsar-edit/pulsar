const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage, registerFont } = require('canvas');

const imageCanvas = createCanvas(1024, 1024);
const context = imageCanvas.getContext('2d');

const channel = 'dev';

loadImage(path.resolve(__dirname, '..', 'resources', 'app-icons', channel, 'png', '1024.png')).then((background) => {
  context.drawImage(background, 0, 0, imageCanvas.width, imageCanvas.height)

  const buffer = imageCanvas.toBuffer('image/png')
  fs.writeFileSync(path.resolve(__dirname, '..', 'resources', 'pulsar.png'), buffer);
})
