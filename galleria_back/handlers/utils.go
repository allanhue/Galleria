package handlers

func parseUint(s string) uint {
	var n uint
	for _, r := range s {
		if r < '0' || r > '9' {
			break
		}
		n = n*10 + uint(r-'0')
	}
	return n
}