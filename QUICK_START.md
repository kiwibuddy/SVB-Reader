# 🚀 Quick Start - Notes Feature Testing

## 📱 Step 1: Install the Build (RIGHT NOW!)

Your iOS build is **READY**! 

### Scan This QR Code:
Look at your terminal - there's a QR code showing!

**Or open this link on your iPhone:**
```
https://expo.dev/accounts/kiwibuddy/projects/SVB-Youth/builds/c2487d96-c1bd-4fd7-92da-548259454c07
```

### Alternative:
```bash
./get-install-link.sh
```

---

## ✅ Step 2: Test Basic Note Features (5 minutes)

### Test 1: Add Note + Emoji
1. Open any story
2. **Long press** a speech bubble
3. Tap **❤️** emoji
4. **Long press again**
5. Tap **📝** (note icon - 5th icon)
6. Type: "This verse speaks to me"
7. Tap **Add Note**
8. ✅ Check: You should see **❤️ 📝** on the bubble

### Test 2: Add Note WITHOUT Emoji
1. **Long press** another speech bubble
2. Tap **📝** (skip emoji)
3. Type: "Important reminder"
4. Tap **Add Note**
5. ✅ Check: You should see **📝** only

### Test 3: View Notes in Reactions Page
1. Go to **Reactions** tab (bottom nav)
2. ✅ Check: See your notes with **📝** icons
3. Tap a **📝** icon
4. ✅ Check: Note modal opens with text

### Test 4: Remove Emoji (Keep Note)
1. Go back to story
2. **Tap the ❤️** emoji
3. ✅ Check: See confirmation "Your note will be preserved"
4. Tap **Remove**
5. ✅ Check: Only **📝** remains

### Test 5: Filter by Notes
1. Go to **Reactions** tab
2. Tap **filter icon** (top right)
3. Toggle **"Has Notes"** ✓
4. ✅ Check: See only reactions with notes

---

## 🧪 Step 3: Advanced Testing (10 minutes)

### Test 6: Edit Note
1. Tap **📝** in Reactions page
2. Tap **Edit**
3. Change text
4. Tap **Update Note**
5. ✅ Check: Note updated

### Test 7: Copy Note
1. Tap **📝** icon
2. Tap **Copy** button
3. Go to Notes app
4. Paste
5. ✅ Check: Note text appears

### Test 8: Delete Note
1. Tap **📝** icon
2. Tap **Delete**
3. Confirm deletion
4. ✅ Check: Note removed from Reactions page

### Test 9: Character Limit
1. Add a new note
2. Type > 500 characters
3. ✅ Check: Counter turns red
4. ✅ Check: Save button disabled

### Test 10: Change Emoji (Keep Note)
1. Find bubble with **❤️ 📝**
2. **Long press** → Select **👍**
3. ✅ Check: Now shows **👍 📝** (note preserved)

---

## 📊 Quick Checklist

Reading View:
- [ ] Long press opens emoji picker
- [ ] 5th icon (📝) appears
- [ ] Can add note + emoji
- [ ] Can add note only
- [ ] Note icon appears on bubble
- [ ] Emoji + note show together

Emoji Management:
- [ ] Tap emoji shows confirmation
- [ ] Can remove emoji (note stays)
- [ ] Can change emoji (note stays)

Note Management:
- [ ] Tap note icon opens editor
- [ ] Can edit note
- [ ] Can delete note
- [ ] Character counter works
- [ ] 500 char limit enforced

Reactions Page:
- [ ] Notes appear in grid
- [ ] Note icon visible
- [ ] Filter by "Has Notes" works
- [ ] Can view/edit notes
- [ ] Copy works

---

## 🐛 Found a Bug?

Note:
1. What you did (steps)
2. What happened (actual)
3. What you expected
4. Device (iPhone model, iOS version)

---

## 📚 Full Documentation

- **`NOTES_FEATURE_SUMMARY.md`** - Complete technical details
- **`NOTES_VISUAL_GUIDE.md`** - Visual mockups and flows
- **`TESTING_BUILD_GUIDE.md`** - Build installation guide
- **`INSTALL_ON_IPHONE.md`** - iPhone installation guide

---

## 🎉 You're Ready!

1. **Scan QR code** from terminal
2. **Install app** on iPhone
3. **Test** all 10 tests above
4. **Report** any issues you find

**Happy Testing!** 🚀

