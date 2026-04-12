import Database from 'better-sqlite3';
import path from 'path';

const sqlite = new Database(path.join(process.cwd(), 'local.db'));

try {
    const blogsInfo = sqlite.prepare("PRAGMA table_info(blogs)").all();
    console.log("Blogs Table Info:", blogsInfo);

    const careersInfo = sqlite.prepare("PRAGMA table_info(careers)").all();
    console.log("Careers Table Info:", careersInfo);
} catch (e) {
    console.error(e);
} finally {
    sqlite.close();
}
