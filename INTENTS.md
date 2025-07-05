# Discord Bot Intents Configuration

## Current Intents (Non-Privileged)

The bot currently uses these **non-privileged** intents that work out of the box:

- `GUILDS` - Access to guild information
- `GUILD_MESSAGES` - Read messages in guilds  
- `MESSAGE_CONTENT` - Read message content (required for message events)

## Privileged Intents (Optional)

If you need additional functionality, you can enable these **privileged intents** in the Discord Developer Portal:

### 1. GUILD_MEMBERS Intent
**Enables:**
- Access to member information
- Member join/leave events
- Member update events

**To enable:**
1. Go to Discord Developer Portal → Your Application → Bot
2. Enable "Server Members Intent"
3. Add `GatewayIntentBits.GuildMembers` to the intents array in `src/index.js`

### 2. GUILD_PRESENCES Intent  
**Enables:**
- User presence information (online/offline status)
- Activity information (what games users are playing)

**To enable:**
1. Go to Discord Developer Portal → Your Application → Bot
2. Enable "Presence Intent"
3. Add `GatewayIntentBits.GuildPresences` to the intents array in `src/index.js`

### 3. MESSAGE_CONTENT Intent
**Status:** ✅ Already enabled (required for message content access)

## How to Add Privileged Intents

If you need privileged intents, update the client configuration in `src/index.js`:

```javascript
this.client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        // Add these if enabled in Developer Portal:
        // GatewayIntentBits.GuildMembers,
        // GatewayIntentBits.GuildPresences,
        // GatewayIntentBits.GuildVoiceStates
    ]
});
```

## Error: "Used disallowed intents"

This error occurs when:
1. Your code requests privileged intents
2. But they're not enabled in Discord Developer Portal

**Solution:**
1. Remove privileged intents from code, OR
2. Enable them in Discord Developer Portal → Bot → Privileged Gateway Intents

## For Most Bots

The current basic intents are sufficient for:
- Slash commands
- Message responses  
- Guild information
- DWZ search functionality

Only add privileged intents if you specifically need member or presence information.
