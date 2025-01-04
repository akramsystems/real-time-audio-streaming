# real-time-audio-streaming

An agent designed for real-time interaction with a large language model (LLM) using voice. This project allows users to stream audio in real-time, process it with speech-to-text (STT) services, and interact with an LLM to receive responses, which can then be converted back to audio using text-to-speech (TTS) services.

## Notes on Implementation

- This is my first typescript project and I'm not sure if I'm doing everything correctly. which is why I'm using the native ws module instead of a library like socket.io. In the future we may want to consider using a library which might make the sending / recieving and management of messages between our websockets more simple, (they probably have better abstractions than me).

-  the openai client is sending a request and getting a response where as we could have used the streaming method, which would have been more optimal since we can then stream the audio response from the LLM as the ai generates the text response.

- we could allow for a more dynamic configuration of the audio stream, i.e. the sample rate, channels, encoding, etc.

- there are no tests, this is bad so tests are for sure the obvious thing which can ensure the correctness of this code

- audio files should be stored in a more secure location, i.e. a cloud storage service like AWS S3


## Features

- **Real-time Audio Streaming**: Stream audio data to a server for processing.
- **Speech-to-Text (STT)**: Convert audio streams into text using AssemblyAI.
- **Text Processing with LLM**: Interact with OpenAI's GPT-4o for processing transcriptions.
- **Text-to-Speech (TTS)**: Convert LLM responses back into audio using ElevenLabs.

## Getting Started

### Prerequisites

- Node.js + npm
- API Keys for the following services:
    - [AssemblyAI](https://www.assemblyai.com/) for speech-to-text services. 
    - [OpenAI](https://www.openai.com/) for language model processing. 
    - [ElevenLabs](https://www.elevenlabs.io/) for text-to-speech services.


### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/akramsystems/real-time-audio-streaming
   cd real-time-audio-streaming
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   Create a `src/config.ts` file and add your API keys:

   ```typescript
   export const config = {
       ASSEMBLY_AI_API_KEY: 'your-assemblyai-api-key',
       OPENAI_API_KEY: 'your-openai-api-key',
       ELEVENLABS_API_KEY: 'your-elevenlabs-api-key'
   };
   ```

4. (Optional) Put your audio file to test the client as `test/audio/test-audio.wav`.  Currently it only accepts audio files in the format of `wav` with a sample rate of `16000`, a single channel, and a 16-bit encoding (pcm_s16le).



### Running the Application

1. Start the __server__:

   ```bash
   npx ts-node server.ts
   ```

2. The server will be running at `http://localhost:8080`.

3. Run the __client__ on a different terminal:

   ```bash
   npx ts-node test/client.ts
   ```

4. The client will connect to the server and start streaming audio, after it is done, it will save the audio to a file in the `test` directory.

you should now see a file with a random name and `.mp3` extension in the main directory this is the audio response from the LLM with the voice from elevenlabs.


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

