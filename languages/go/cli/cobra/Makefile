format:
	go fmt

vet:
	go vet main.go

lint:
	find . -type d | xargs -L 1 golint

build:
	go fmt
	go vet main.go
	find . -type d | xargs -L 1 golint
	go build -o ./bin/go-cli ./main.go

install:
	go fmt
	go vet main.go
	find . -type d | xargs -L 1 golint
	go build -o ./bin/go-cli ./main.go
	sudo cp ./bin/go-cli /usr/local/bin/
