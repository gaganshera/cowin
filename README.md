# cowin

![Cowin](demo.jpg "Cowin")

Get real-time notifications and updated slot availability information from Cowin.
Select multiple districts and choose which vaccine, age group and dose you want to monitor slots for.

## How to install

### Recommended way: With nodejs installed

#### Prerequisites: Nodejs (Install -> https://nodejs.org/en/download/)

### Or alternatively, run directly docker (Desktop notifications not supported on docker for now)

#### Prerequisites: Docker (Install -> https://docs.docker.com/engine/install/)

### Run with Nodejs/npm

- Make sure you have nodejs installed
- Clone this repository
- Build dependencies: `npm i`
- Start server `npm start`
- Go to http://localhost:1234/appointments/

---

### Run with Docker

- Make sure you have docker installed
- Clone this repository
- Build docker image: `docker build -t "images/cowin" .`
- Run docker container: `docker run --name cowin -p 1234:1234 -d images/cowin`
- Go to http://localhost:1234/appointments/
