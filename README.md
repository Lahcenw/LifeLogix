⬇️ Installation and Local Setup

Follow these steps to get a copy of LifeLogix running on your local machine for development and testing.

 I. Prerequisites and System Tools

Ensure you have the following essential software installed and configured on your computer:

1.  **Node.js & npm:** Download and install the latest stable version of Node.js.
2.  **Git:** Download and install Git for version control.
3.  **MongoDB Server Community:** Download and install the MongoDB Community Server.
4.  **MongoDB Compass:** Install this graphical interface (GUI) tool to manage your database (highly recommended).

## II. Repository Setup

1.  **Clone the Repository:**
    Open your terminal and clone the project from GitHub:

    ```bash
    git clone https://www.github.com/Lahcenw/LifeLogix.git
    cd LifeLogix
    ```

2.  **Install Dependencies:**
    You must install the required packages for both the backend and the frontend.

    ```bash
    # Install backend dependencies
    cd backend
    npm install
    cd ../

    # Install frontend dependencies
    cd lifelogix
    npm install
    cd ../
    ```

## III. Database Connection (MongoDB)

This project requires a running MongoDB instance.

1.  **Start the MongoDB Server:**
    Run the MongoDB daemon from your terminal. *(It's highly recommended to run this as a service, but for a quick start, use the following path):*

    ```bash
    "C:\Program Files\MongoDB\Server\[current version]\bin\mongod.exe"
    ```

2.  **Configure Environment Variables (`.env`):**
    There's no need to create a '.env' file, just download this data file and import it into mongoDB Compass:
    https://drive.google.com/drive/folders/1OnfqDCy48TpvVGpkEygCE0SvTmjltkhG?usp=drive_link


## IV. Run the Application

You will need two separate terminal windows for the server and the client.

## Terminal 1: Start the Backend (API)

```bash
cd backend
npm start
# Backend is running, connected to the database, and listening on port 5000.
```

## Terminal 2: Start the Frontend 

```bash
cd lifelogix 
npm run dev
# Frontend is running on http://localhost:3000.
```
## V. Access the Application

Once both the backend and frontend are running, open your web browser and navigate to:

```
http://localhost:3000/login
```
