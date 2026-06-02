"""
Migration script: Add missing columns to User table (google_id, avatar_url)
and ensure Team table has all required columns (sport_id, team_type, age_group, visibility, venue_id)
"""
from database import engine
from sqlalchemy import text

def run_migrations():
    with engine.connect() as conn:
        # Check existing columns in User table
        result = conn.execute(text(
            "SELECT column_name FROM information_schema.columns WHERE table_name='User' ORDER BY ordinal_position"
        ))
        existing_cols = [r[0] for r in result]
        print("Existing User columns:", existing_cols)

        # Add google_id if missing
        if "google_id" not in existing_cols:
            conn.execute(text('ALTER TABLE "User" ADD COLUMN google_id VARCHAR UNIQUE'))
            print("Added google_id column")
        else:
            print("google_id already exists")

        # Add avatar_url if missing
        if "avatar_url" not in existing_cols:
            conn.execute(text('ALTER TABLE "User" ADD COLUMN avatar_url VARCHAR'))
            print("Added avatar_url column")
        else:
            print("avatar_url already exists")

        # Check Team table columns
        result2 = conn.execute(text(
            "SELECT column_name FROM information_schema.columns WHERE table_name='Team' ORDER BY ordinal_position"
        ))
        team_cols = [r[0] for r in result2]
        print("Existing Team columns:", team_cols)

        if "sport_id" not in team_cols:
            conn.execute(text('ALTER TABLE "Team" ADD COLUMN sport_id VARCHAR REFERENCES "Sport"(id)'))
            print("Added sport_id column to Team")
        if "team_type" not in team_cols:
            conn.execute(text('ALTER TABLE "Team" ADD COLUMN team_type VARCHAR'))
            print("Added team_type column to Team")
        if "age_group" not in team_cols:
            conn.execute(text('ALTER TABLE "Team" ADD COLUMN age_group VARCHAR'))
            print("Added age_group column to Team")
        if "visibility" not in team_cols:
            conn.execute(text("ALTER TABLE \"Team\" ADD COLUMN visibility VARCHAR NOT NULL DEFAULT 'PRIVATE'"))
            print("Added visibility column to Team")
        if "venue_id" not in team_cols:
            conn.execute(text('ALTER TABLE "Team" ADD COLUMN venue_id INTEGER REFERENCES "Venue"(id)'))
            print("Added venue_id column to Team")

        conn.commit()
        print("\nMigration complete!")

if __name__ == "__main__":
    run_migrations()
