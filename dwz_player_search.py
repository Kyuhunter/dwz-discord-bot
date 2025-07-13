#!/usr/bin/env python3
"""
DWZ Player Search Script
Interfaces with the dwz-info package for the Discord bot
"""
import sys
import json
import argparse

try:
    from dwz_info import DWZInfo
except ImportError:
    print(json.dumps({"error": "dwz-info package not installed. Install with: pip install dwz-info"}))
    sys.exit(1)

def search_players(player_name, club_name=None):
    """Search for players by name"""
    try:
        dwz = DWZInfo()
        players = dwz.search_players(player_name)
        
        # Filter by club if provided
        if club_name and players:
            filtered_players = []
            for player in players:
                if club_name.lower() in player.get('club', '').lower():
                    filtered_players.append(player)
            players = filtered_players
        
        if not players:
            return {"error": "No players found"}
        
        return {"players": players}
    except Exception as e:
        return {"error": str(e)}

def get_player_details(zpk):
    """Get detailed player information including tournament history"""
    try:
        dwz = DWZInfo()
        details = dwz.get_player_details(zpk)
        
        if not details:
            return {"error": "Player details not found"}
        
        # Extract tournaments if available
        tournaments = details.get('tournaments', [])
        return {"tournaments": tournaments}
    except Exception as e:
        return {"error": str(e)}

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='DWZ Player Search')
    parser.add_argument('action', choices=['search', 'details'], 
                       help='Action to perform')
    parser.add_argument('query', help='Player name or ZPK')
    parser.add_argument('club', nargs='?', help='Club filter for search')
    
    args = parser.parse_args()
    
    if args.action == 'search':
        result = search_players(args.query, args.club)
    elif args.action == 'details':
        result = get_player_details(args.query)
    else:
        result = {"error": "Invalid action"}
    
    # Output JSON result
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    # Exit with code 1 if there's an error or multiple players found
    if 'error' in result:
        sys.exit(1)
    elif 'players' in result and len(result['players']) > 1:
        sys.exit(1)  # Multiple players found - still valid but different exit code
    else:
        sys.exit(0)

if __name__ == '__main__':
    main()
