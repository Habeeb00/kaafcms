import Database from 'better-sqlite3';
import path from 'path';

const sqlite = new Database(path.join(process.cwd(), 'local.db'));

try {
    console.log("Adding missing columns to 'blogs' table...");
    try { sqlite.prepare("ALTER TABLE blogs ADD COLUMN author TEXT").run(); } catch (e) {}
    try { sqlite.prepare("ALTER TABLE blogs ADD COLUMN author_image_url TEXT").run(); } catch (e) {}
    try { sqlite.prepare("ALTER TABLE blogs ADD COLUMN read_time TEXT").run(); } catch (e) {}
    
    console.log("Adding missing columns to 'careers' table...");
    try { sqlite.prepare("ALTER TABLE careers ADD COLUMN location TEXT").run(); } catch (e) {}
    try { sqlite.prepare("ALTER TABLE careers ADD COLUMN type TEXT").run(); } catch (e) {}
    try { sqlite.prepare("ALTER TABLE careers ADD COLUMN work_mode TEXT").run(); } catch (e) {}
    try { sqlite.prepare("ALTER TABLE careers ADD COLUMN link TEXT").run(); } catch (e) {}

    console.log("Migration complete!");
} catch (e) {
    console.error("Migration failed:", e);
} finally {
    sqlite.close();
}
