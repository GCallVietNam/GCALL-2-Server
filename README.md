# GCALL 2 NODE.JS

***

Gcall brings a platform for SMEs and online stores to support their customer better. This repository contains Gcall backend source code built in Node.js

### Prerequisites

***

* Self-deployed Parse Server, check it out [here](https://github.com/ParsePlatform/parse-server)
* Amazon Web Service SNS and APNS, check it out [here](http://docs.aws.amazon.com/sns/latest/dg/sns-mobile-push-send-apns-voip.html)
* Twilio account

### Features

***

* Manipulate database through Parse
* Use Push Notification service from Parse
* Push VoIP using Amazon Web Service
* Make call with Twilio in WebRTC standard
* Route calls to appropriate agents in group
* Check call history
* Divide hotline packages
* Schedule calculating used features
* Schedule checking expiry date of hotlines
* Send email using self-deployed mail server
* All asynchronous callback functions from other libraries are promisified by Bluebird for effective computations

### Utility modules

***

* Express - Node.js web application framework: <http://expressjs.com/>
* Twilio REST API: <https://www.twilio.com/docs/api/rest>
* Amazon Web Service JavaScript SDK: <http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/index.html>
* Parse Server: <https://github.com/ParsePlatform/parse-server>
* Kaiseki - Node.js API Client for open-source Parse Server: <https://github.com/shiki/kaiseki>
* Bluebird - Promise library for JavaScript: <http://bluebirdjs.com/docs/api-reference.html>
* EJS Template: <http://ejs.co/>
* Node Schedule: <https://github.com/node-schedule/node-schedule>
* Nodemailer: <https://nodemailer.com/>

### Source tree

***

```
root
│   README.md
│   package.json
│   server.js
|
└───config
│       app-arn.js
│       aws-config.json
│       country-list.json
|       import-country-list.js
|       mailer.js
│       parse-config.js
|       twilio-master.js
│   
└───lib
│       aws-sns-promise.js
│       kaiseki-promise.js
│       kaiseki.js
|       scheduleCalculatingCalls.js
|       scheduleCheckingHotline.js
│       twilio-promise.js
|       util.js
│
└───model
│       agent.js
│       caller.js
│       calllog.js
|       group.js
|       unsolved.js
│       user.js
│
└───route
│       calllog.js
│       controller.js
│       group.js
|       index.js
|       isAuthenticated.js
│       user.js
|       util.js
│
└───static
│       └───css
│       │       ... 
│       │
│       └───images
|       │       ...
│       │
|       └───script
│               main.js
|
└───views
        error.ejs
        home.ejs
        index.ejs
```

### Database tables

***

**User**

| objectId | email | username | password | fullname | phone | sid | authToken |deviceToken | hasGroups |
|:------:|:------:|:------:|:------:|:------:|:------:|:------:|:------:|:------:|:------:|
| string | string | string | string | string | string | string | string | array[object] | array[string] |

**Group**

| objectId | groupId | hotline | name | description | pricing | subgroups | topic | registerAt | expireAt | lastCalculated | simultaneousSeconds |
|:------:|:------:|:------:|:------:|:------:|:------:|:------:|:------:|:------:|:------:|:------:|:------:|
| string | string | string | string | string | string | string | string | string | string | string | number |

**Agent_Group**

| objectId | groupId | hotline | groupName | email | fullname | phone | topic | addedBy | subscriptions | lastActive | accepted |
|:------:|:------:|:------:|:------:|:------:|:------:|:------:|:------:|:------:|:------:|:------:|:------:|
| string | string | string | string | string | string | string | string | string | array[object] | string | boolean |

**Session**

| objectId | sessionToken | subscriptions | deviceToken |
|:------:|:------:|:------:|:------:|
| string | string | array[object] | object |

**Caller**

| objectId | phone | code | verified |
|:------:|:------:|:------:|:------:|
| string | string | string | boolean |

**Calllog**

| objectId | callSid | accountSid | authToken | groupId | groupName | hotline | email |
|:------:|:------:|:------:|:------:|:------:|:------:|:------:|:------:|
| string | string | string | string | string | string | string | string |

**Unverified**

| objectId | sessionToken | subscriptions | deviceToken |
|:------:|:------:|:------:|:------:|
| string | string | array[object] | object |

**Unsolved**

| objectId | groupId | master | caller | groupName | hotline | solvedBy |
|:------:|:------:|:------:|:------:|:------:|:------:|:------:|
| string | string | string | string | string | string | string |

### Installation

***

* Clone project:
~~~
git clone https://github.com/GCallVietNam/GCALL-2-Server.git
~~~

* Install utility modules:
~~~
npm install
~~~

* Start server:
~~~
npm start
~~~

### Author

***

Nguyen The Hien <hien.nguyen@gpat.vn> - Backend developer at GPAT Company

### License

***

This project is licensed under the MIT License

### Acknowledgements

***

* This version does not follow any architecture
* It's quite hard to read
* It depends greatly on third-party services like Parse, Twilio, and Amazon
* Complex asynchronous computations
* Each route handling function follows many sub-steps