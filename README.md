# INFO3333 Group Project Tutorial 12 Group 5 Phase 3

## Running the merged project

The merged project is in the `merged` folder. It runs the Express backend and Vite frontend together.

1. Open a terminal in the project root.
2. Install the Node dependencies:

   ```bash
   cd merged
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the app in a browser:

   ```text
   http://localhost:3000
   ```

To stop the server, press `Ctrl + C` in the terminal.

## Running the Password project

The separate Password project is in the `Password` folder. It runs a Python server that hosts the demo pages and starts a WebSocket server for the TLS simulation.

1. Open a terminal in the project root.
2. Install the required Python package if it is not already installed:

   ```bash
   python3 -m pip install websockets
   ```

3. Start the Password server:

   ```bash
   cd Password
   python3 new_server.py
   ```

4. Open the client page in a browser:

   ```text
   http://localhost:8000/client.html
   ```

5. To view the sniffer/demo hacker page, open:

   ```text
   http://localhost:8000/hacker.html
   ```

To stop the server, press `Ctrl + C` in the terminal.
