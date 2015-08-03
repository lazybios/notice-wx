FROM google/nodejs

COPY ./app.js /app
COPY ./package.json /app
COPY ./app /app/
COPY ./config /app/

WORKDIR /app

EXPOSE 18080
CMD npm -g install forever && npm install && npm start