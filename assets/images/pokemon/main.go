package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

type Sprites struct {
	Front string `json:"front_default"`
}

type Pokemon struct {
	Name    string  `json:"name"`
	Url     string  `json:"url"`
	Sprites Sprites `json:"sprites"`
}

type PokemonResponse struct {
	Results []Pokemon `json:"results"`
}

func main() {
	const url string = "https://pokeapi.co/api/v2/pokemon?limit=1400"
	response, err := http.Get(url)
	if err != nil {
		fmt.Printf("error making http request: %s\n", err)
		os.Exit(1)
	}
	defer response.Body.Close()

	var decoder = json.NewDecoder(response.Body)
	var pokemonResponse PokemonResponse
	err = decoder.Decode(&pokemonResponse)
	if err != nil {
		fmt.Printf("error decoding http response: %s\n", err)
		os.Exit(1)
	}

	for index, pokemon := range pokemonResponse.Results {
		fmt.Println(index)
		response, err := http.Get(pokemon.Url)
		if err != nil {
			fmt.Printf("error making http request: %s\n", err)
			os.Exit(1)
		}
		defer response.Body.Close()

		var decoder = json.NewDecoder(response.Body)
		var pokemon Pokemon
		err = decoder.Decode(&pokemon)
		if err != nil {
			fmt.Printf("error decoding http response: %s\n", err)
			os.Exit(1)
		}

		var file string = fmt.Sprintf("./png/%s.png", strings.ToLower(pokemon.Name))
		DownloadFile(file, pokemon.Sprites.Front)
	}
}

func DownloadFile(filepath string, url string) error {
	// Get the data
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Create the file
	out, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer out.Close()

	// Write the body to file
	_, err = io.Copy(out, resp.Body)
	return err
}
