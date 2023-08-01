package main

import (
	"fmt"
	"os"
	"strings"
	"syscall/js"

	"github.com/entooone/go-fswiki"
)

func parseOption(option js.Value) fswiki.FormatOption {
	foption := fswiki.FormatOption{}

	align := option.Get("formatTableAlignOption").String()
	switch align {
	case "left":
		foption.TableAlign = fswiki.TableAlignLeft
	case "right":
		foption.TableAlign = fswiki.TableAlignRight
	default:
		fmt.Fprintf(os.Stderr, "invalid formatTableAlignOption: %s\n", align)
		foption.TableAlign = fswiki.TableAlignLeft
	}

	foption.TableInsertSpaceToEndOfCell = option.Get("formatTableCellSuffixSpace").Bool()

	return foption
}

func formatDocument(s string, option fswiki.FormatOption) string {
	out, err := fswiki.FormatDocumentWithOption(strings.NewReader(s), option)
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
			option := parseOption(args[1])

			return formatDocument(s, option)
		}),
	}))
	<-ch
}
