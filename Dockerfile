FROM node
WORKDIR /work
COPY package-lock.json package.json ./
RUN npm ci
COPY . .
RUN node_modules/.bin/webpack && cd dist && tar czvf ../yahtzee-react.tar.gz .
