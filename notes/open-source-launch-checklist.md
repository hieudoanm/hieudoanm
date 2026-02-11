# Open Source Launch Checklist

16 things every open source project should have before you try to get attention.

## README and first impression

- [ ] 1. **Demo GIF** at the top of the README
- [ ] 2. **One-line description** of what the project does
- [ ] 3. **One-command install**
- [ ] 4. **Live demo link**
- [ ] 5. **License** added (MIT, Apache 2.0, etc.)

## Discoverability

- [ ] 6. **Repo topics** set
- [ ] 7. **Social preview image** added

## Repo health

- [ ] 8. **CI passing** (green badge)
- [ ] 9. **Secrets removed from git history** (and rotated, since scrubbing history doesn't un-leak a key)

## Community

- [ ] 10. **"Good first issue" labels** on beginner-friendly issues
- [ ] 11. **Contributing guide** written
- [ ] 12. **Issue templates** added
- [ ] 13. **GitHub Discussions** turned on

## Launch and maintenance

- [ ] 14. **Tagged release** with a changelog
- [ ] 15. **Posted on Show HN**
- [ ] 16. **Responding to every issue within a day**

## Bonus: "make no mistakes"

Nobody ships perfectly, so do a pre-launch dry run: clone the repo fresh, follow your own install steps, and confirm the demo link works before you post.

> **Order tip:** finish items 8 and 9 before item 15. Launching on Show HN with a failing build or a leaked key in the history wastes your one shot at the front page.
