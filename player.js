/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var context = new AudioContext();
var source = false;

/**
 * Handles the Select File button being clicked.
 * @param evt the event object
 */
function handleFileSelect(evt) {

    // Stop playing before loading a new file
    stopAudio();

    var file = evt.target.files[0];

    // Only allow PNG files
    if (!file.type.match("image/png")) {
        setStatus("error");
        return;
    }

    // Read and decode the file
    var reader = new FileReader();
    reader.addEventListener("load", function (evt) {

        var pngReader = new PNGReader(evt.target.result);
        pngReader.parse(function (err, png) {

            if (err) {
                setStatus("error");
            } else {
                decode(png);
            }
        });
    });

    reader.readAsArrayBuffer(file);
}

/**
 * Decodes the PNG file and passes the data to decodeAudio.
 * @param png the decoded PNG data
 */
function decode(png) {

    setStatus("decoding")

    // Get width and height of PNG
    var width = png.getWidth();
    var height = png.getHeight();

    // getPixel returns an array of length 4
    var lengthData = png.getPixel(0, 0);
    var length = 0;
    for (var i = 0; i < 4; i++) {
        length = (length << 8) + lengthData[i];
    }

    // Create buffer to hold audio data
    var backBuffer = new ArrayBuffer(length);

    // Create Uint8Array to write to the buffer
    var buffer = new Uint8Array(backBuffer);
    var pos = 0;
    for (var y = 0; y < height; y++) {
        for (var x = (y > 0 ? 0 : 1); x < width; x++) {
            var pixel = png.getPixel(x, y);
            for (var i = 0; i < 4; i++) {
                if (pos < length) buffer[pos++] = pixel[i];
            }

            // Stop reading once we've read the data in its entirety
            if (pos == length) break;
        }
        if (pos == length) break;
    }

    // Play the audio
    decodeAudio(backBuffer);
}

/**
 * Attempts to decoded audio data. If successful, plays the audio.
 * @param buffer the data to attempt to decode
 */
function decodeAudio(buffer) {

    context.decodeAudioData(buffer, playAudio, function () {
        setStatus("error");
    });
}

/**
 * Plays the audio data specified by audio.
 * @param audio the audio to play
 */
function playAudio(audio) {

    // Initialize the buffer source
    source = context.createBufferSource();
    source.buffer = audio;

    // Connect the source to the destination (the speakers)
    source.connect(context.destination);

    // Once the audio has finished playing, update the status bar and set source to false
    // This is to ensure that we only ever have one source playing at once
    source.onended = function () {
        source = false;

        setStatus("stopped");
    }

    // Begin playback
    source.start(0);

    setStatus("playing");
}

/**
 * Stops the audio from playing (curr
 */
function stopAudio() {

    if(source) source.stop(0);
    source = false;

    setStatus("stopped");
}

/**
 * Updates the player-status element according to the player's internal state.
 * @param status the player's state
 */
function setStatus(status) {

    var statusEl = document.getElementById("player-status");

    switch (status) {
        case "initial":
            statusEl.className = "";
            statusEl.innerHTML = "";
            break;
        case "decoding":
            statusEl.className = "";
            statusEl.innerHTML = "Decoding";
            break;
        case "playing":
            statusEl.className = "playing";
            statusEl.innerHTML = "Playing";
            break;
        case "stopped":
            statusEl.className = "";
            statusEl.innerHTML = "Stopped";
            break;
        case "error":
            statusEl.className = "error";
            statusEl.innerHTML = "Error";
    }
}

// Add all relevant event listeners and set the initial status
window.addEventListener("load", function () {

    document.getElementById("player-file").addEventListener("change", handleFileSelect, false);
    document.getElementById("player-file-select").addEventListener("click", function () {
        document.getElementById("player-file").click();
    });
    document.getElementById("player-stop").addEventListener("click", stopAudio, false);

    setStatus("initial");
});