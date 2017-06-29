# Build process for OpenTripPlanner-data-container
[![Build](https://api.travis-ci.org/HSLdevcom/OpenTripPlanner-data-container.svg?branch=master)](https://travis-ci.org/HSLdevcom/OpenTripPlanner-data-container)

## This project:
Contains tools for fetching, building and deploying fresh otp data-containers
for consumption by hsl, waltti and finland otp instances.

## Main components

### otp-data-builder
The actual data builder application. This is a node.js application that fetches
and processes new gtfs/osm data. It's build around gulp and all separate steps of
databuilding process can also be called directly from the source tree. The only
required external dependency is docker. Docker is used for launching external
commands that do for example data manipulation.

install gulp cli:
  `npm install -g gulp-cli`

install app deps:
  `npm install`

update osm data:
  `gulp osm:update`

download new gtfs data wor waltti:
  `ROUTER=waltti gulp gtfs:dl`

#### data processing steps
Currently there are 4 steps for processing gtfs data:
1. gtfs:download
Downloads a GTFS package from configured location, tests the file with otp, if
test passes data is copied to dir id. The resulting zip is named <id>.zip.
1. gtfs:id
Sets the gtfs feed id to <id> and copies data to directory fit.
1. gtfs:fit
Runs configured map fits. Copies data to directory filterProcess.
1. gtfs:filter
Runs configured filterings. Copies data to directory ready.

and single steps for processing gtfs data:
1. gtfs:download
Downloads a GTFS package from configured location, tests the file with otp, if
test passes data is copied to dir id. The resulting zip is named <id>.zip.
1. gtfs:id
Sets the gtfs feed id to <id> and copies data to directory fit.
1. gtfs:fit
Runs configured map fits. Copies data to directory filterProcess.
1. gtfs:filter
Runs configured filterings. Copies data to directory ready.





Normally when the application is running (as a container) the index.js is used.

The end result of a data build is a deployed docker container ready to be deployed

Each datacontainer image runs a http server listening to port 8080, serving both a gtfs data bundle and a pre-built graph:
- hsl: http://localhost:8080/router-hsl.zip and graph-hsl-<otpversion>.zip
- waltti: http://localhost:8080/router-waltti.zip and graph-waltti-<otpversion>.zip
- finland: http://localhost:8080/router-finland.zip and graph-finland-<otpversion>.zip

### otp-data-tools
Contains tools for gtfs manipulation, such as One Bus Away gtfs filter...
these tools are packaged inside docker container and are used dunring the data build process
