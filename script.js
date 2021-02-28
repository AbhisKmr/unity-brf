import { brfv5 } from './js/brfv5/brfv5__init.js'
import { loadBRFv5Model } from './js/brfv5/brfv5__init.js'
import { configureCameraInput } from './js/brfv5/brfv5__configure.js'
import { configureFaceTracking } from './js/brfv5/brfv5__configure.js'
import { configureNumFacesToTrack } from './js/brfv5/brfv5__configure.js'
import { startCamera } from './js/utils/utils__camera.js'
import { drawInputMirrored } from './js/utils/utils__canvas.js'

import {
    mountPNGOverlay, setSizePNGOverlay, hidePNGOverlay,
    loadPNGOverlays, updateByFace
} from './js/ui/ui__overlay__png.js'
import { ScaleMode } from './js/utils/utils__resize.js'

const _images = [
    {
        // url: './assets/brfv5_img_lion.png', alpha: 0.66,
        // scale: 0.66, xOffset: 0.5, yOffset: 0.40
    },
    {
        // url: './assets/brfv5_img_glasses.png', alpha: 1.00,
        // scale: 0.25, xOffset: 0.5, yOffset: 0.45
    }
];

mountPNGOverlay(document.getElementById('container'), ScaleMode.NO_SCALE)
loadPNGOverlays(_images)

const _appId = 'brfv5.browser.minimal.modules.pngoverlay' // (mandatory): 8 to 64 characters, a-z . 0-9 allowed

const _webcam = document.getElementById('_webcam')
const _imageData = document.getElementById('_imageData')

// Those variables will be retrieved from the stream and the library.
let _brfv5Manager = null
let _brfv5Config = null
let _width = 0
let _height = 0

// loadBRFv5Model and openCamera are being done simultaneously thanks to Promises. Both call
// configureTracking which only gets executed once both Promises were successful. Once configured
// trackFaces will do the tracking work and draw the results.

startCamera(_webcam, { width: 640, height: 480, frameRate: 30, facingMode: 'user' }).then(({ video }) => {

    console.log('openCamera: done: ' + video.videoWidth + 'x' + video.videoHeight)

    _width = video.videoWidth
    _height = video.videoHeight

    _imageData.width = _width
    _imageData.height = _height

    const container = document.getElementById("container")
    container.style.width = _width + 'px'
    container.style.height = _height + 'px'

    setSizePNGOverlay(_width, _height)

    configureTracking()

}).catch((e) => { if (e) { console.error('Camera failed: ', e) } })

loadBRFv5Model('68l', 8, './js/brfv5/models/', _appId,
    (progress) => { console.log(progress) }).then(({ brfv5Manager, brfv5Config }) => {

        console.log('loadBRFv5Model: done')

        _brfv5Manager = brfv5Manager
        _brfv5Config = brfv5Config

        configureTracking()

    }).catch((e) => { console.error('BRFv5 failed: ', e) })

const configureTracking = () => {

    if (_brfv5Config !== null && _width > 0) {

        configureCameraInput(_brfv5Config, _width, _height)
        configureNumFacesToTrack(_brfv5Config, 1)
        configureFaceTracking(_brfv5Config, 3, true)

        _brfv5Manager.configure(_brfv5Config)

        trackFaces()
    }
}

const trackFaces = () => {

    if (!_brfv5Manager || !_brfv5Config || !_imageData) { return }

    const ctx = _imageData.getContext('2d')

    drawInputMirrored(ctx, _width, _height, _webcam)

    hidePNGOverlay()

    _brfv5Manager.update(ctx.getImageData(0, 0, _width, _height))

    const faces = _brfv5Manager.getFaces()

    // console.log("its left: " + faces[2].landmarks);
    // console.log("its right: " + faces[14].landmarks);

    for (let i = 0; i < faces.length; i++) {

        const face = faces[i]

        if (face.state === brfv5.BRFv5State.FACE_TRACKING) {
            updateByFace(face, i, true)
        } else {
            updateByFace(null, i, false)
        }
    }
    requestAnimationFrame(trackFaces)
}

function pass() {
    console.log("clicked");
    var s = JSON.parse('{"positionForRight":{"x": 0,"y": 0,"z": 0},"positionForLeft":{"x": 0,"y": 0,"z": 0},"scaleForLeft":{"x": 3.5,"y": 3.5,"z": 3.5},"scaleForRight":{"x": 3.5,"y": 3.5,"z": 3.5}}');
    console.log(s);
    unity.SendMessage('ObjectContainer', 'TrsnsformObject', JSON.stringify(s));
}

function load() {
    unity.SendMessage('ObjectContainer', 'LoadContent', "https://mirrar.s3.ap-south-1.amazonaws.com/amazingabhishek/AssetBundles/righter");
}