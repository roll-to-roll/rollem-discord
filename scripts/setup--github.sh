
echo "## Setting up Github Connection"
echo "### Getting Github CLI (via Winget)"
# OFficial Package https://winstall.app/apps/GitHub.cli
# From docs https://github.com/cli/cli
winget install --id GitHub.cli && true

echo
echo "... you may need to re-launch and re-run the script to get these into PATH ..."
echo "... I could not find a good way to refresh the PATH variable here ..."
echo

echo "## Checking for auth"
if ! gh auth status; then
  echo "### Missing auth -- please sign in"
  gh auth login
else
  echo "### Already authed"
fi
