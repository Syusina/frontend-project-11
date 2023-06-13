install:
	npm ci

develop:
	npx webpack serve

lint:
	npx eslint

build:
	NODE_ENV=production npx webpack