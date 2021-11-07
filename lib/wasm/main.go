package main

import (
	"strings"
	"syscall/js"

	"github.com/entooone/go-fswiki"
)

func formatDocument(s string) string {
	out, err := fswiki.FormatDocument(strings.NewReader(s))
	if err != nil {
		return s
	}
	return string(out)
}

func main() {
	ch := make(chan struct{})
	js.Global().Set("GoFSWiki", js.ValueOf(map[string]interface{}{
		"formatDocument": js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			if len(args) < 1 {
				return ""
			}

			s := args[0].String()
			return formatDocument(s)
		}),
	}))
	<-ch
}
