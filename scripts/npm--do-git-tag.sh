#!/bin/bash

trap "echo 'Command exited with non-zero status $0'" ERR
set -e

# # Default variable values
# verbose_mode=false

# Function to display script usage
usage() {
 echo "Usage: $0 [OPTIONS]"
 echo "Options:"
 echo "         -h,  --help      Display this help message"
 echo "         -f, --force      Force-set and force-push tags"
 echo "           --dry-run      Do not perform the final Tag + Push"
 echo "  --skip-clean-check      Skip checking whether or not the git repo is clean"
#  echo " -v, --verbose   Enable verbose mode"
#  echo " -f, --file      FILE Specify an output file"
}

POSITIONAL_ARGS=()
TAG_SET_FLAGS=""
TAG_PUSH_FLAGS=""
DRY_RUN=false
DO_CLEAN_CHECK=true

while [[ $# -gt 0 ]]; do
  case $1 in
    -f|--force)
      TAG_SET_FLAGS="$TAG_SET_FLAGS -f"
      TAG_PUSH_FLAGS="$TAG_PUSH_FLAGS -f"
      shift # past argument
      ;;
    --dry-run)
      DRY_RUN=true
      shift # past argument
      ;;
    --skip-clean-check)
      DO_CLEAN_CHECK=false
      shift # past argument
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*|--*)
      echo "Unknown option $1"
      exit 1
      ;;
    *)
      POSITIONAL_ARGS+=("$1") # save positional arg
      shift # past argument
      ;;
  esac
done

# find relevant packages
PACKAGE_JSON_LOCATIONS=$(yarn workspaces list --no-private --json | jq --raw-output0 '.location'| xargs -0I {} echo {})

# print versions table
VERSION_NAME_TABLE=$(echo "$PACKAGE_JSON_LOCATIONS" | xargs -I {} bash -c "jq --raw-output0 '.version' ./{}/package.json | xargs -0I $0 echo $0 -- {}" | sort --version-sort --reverse)

# extract versions alone
VERSIONS=$(yarn workspaces list --no-private --json | jq --raw-output0 '.location' | xargs -0I {} bash -c "jq --raw-output0 '.version' ./{}/package.json | xargs -0I $0 echo $0")
UNIQ_VERSIONS=$(echo "$VERSIONS" | uniq)
UNIQ_VERSIONS_COUNT=$(echo "$UNIQ_VERSIONS" | wc -l)

echo
echo VERSIONS
echo "$VERSION_NAME_TABLE"
echo
echo UNIQUE VERSIONS
echo "$UNIQ_VERSIONS"
echo "$UNIQ_VERSIONS_COUNT total"
if [[ $UNIQ_VERSIONS_COUNT -ne 1 ]] ; then
  echo "TOO MANY VERSIONS"
  exit 1
fi

echo
echo "APPLYING GIT TAG"
GIT_TAG="v$UNIQ_VERSIONS"
echo "$GIT_TAG"
echo

if $DO_CLEAN_CHECK ; then
  trap 'echo "Pending git changes dected. They must be committed or stashed "' ERR
  git update-index --refresh &>/dev/null
  git diff-index --quiet HEAD --
fi

trap 'echo "Command exited with non-zero status"' ERR
echo "git tag $TAG_SET_FLAGS -a \"$GIT_TAG\" -m \"Tagging release $GIT_TAG\""
$DRY_RUN && echo "Skipped" || git tag $TAG_SET_FLAGS -a "$GIT_TAG" -m "Tagging release $GIT_TAG"

echo
echo "PUSHING TAGS TO REPO"
echo "git push $TAG_PUSH_FLAGS --follow-tags"
$DRY_RUN && echo "Skipped" || git push $TAG_PUSH_FLAGS --follow-tags

echo
echo "FIN"