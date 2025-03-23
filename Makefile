update:
	pnpm update --latest -r

clear-branches:
	git branch | grep -v "master" | xargs git branch -D

clear-node-modules:
	find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
