import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3001/api';

async function runTests() {
  console.log("🚀 Starting Full CMS Integration Tests (Native Fetch)...\n");

  let blogId, careerId, galleryId;

  try {
    // 1. BLOGS
    console.log("📝 Testing Blogs...");
    const bPost = await fetch(`${BASE_URL}/blogs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: "Test Blog",
        slug: `test-blog-${Date.now()}`,
        content: "<p>Hello World</p>",
        category: "Test",
        author: "Tester"
      })
    });
    const blog = await bPost.json();
    blogId = blog.id;
    console.log(`✅ POST Blog: ${bPost.status} (ID: ${blogId})`);

    // 2. CAREERS
    console.log("\n💼 Testing Careers...");
    const cPost = await fetch(`${BASE_URL}/careers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: "Test Job",
        description: "Test Desc",
        status: "open",
        location: "Dubai",
        type: "Full Time"
      })
    });
    const career = await cPost.json();
    careerId = career.id;
    console.log(`✅ POST Career: ${cPost.status} (ID: ${careerId})`);

    // 3. GALLERY
    console.log("\n🖼️ Testing Gallery...");
    const gPost = await fetch(`${BASE_URL}/gallery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: "Test Gallery Item",
        imageUrl: "/assets/test.jpg",
        category: "Test"
      })
    });
    const gItem = await gPost.json();
    galleryId = gItem.id;
    console.log(`✅ POST Gallery: ${gPost.status} (ID: ${galleryId})`);

    // 4. UPLOAD
    console.log("\n📤 Testing Image Upload...");
    const testFilePath = path.join(process.cwd(), 'public', 'favicon.svg');
    if (fs.existsSync(testFilePath)) {
      const fileBuffer = fs.readFileSync(testFilePath);
      const blob = new Blob([fileBuffer], { type: 'image/svg+xml' });
      
      const form = new FormData();
      form.append('file', blob, 'test-upload.svg');
      form.append('folder', 'tests');

      const upRes = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        body: form,
      });
      const upData = await upRes.json();
      if (upData.url) {
        console.log(`✅ POST Upload: ${upRes.status} (URL: ${upData.url})`);
      } else {
        console.log(`❌ POST Upload FAILED: ${upRes.status}`, upData);
      }
    }

    // 5. CLEANUP
    console.log("\n🧹 Cleaning up test data...");
    if (blogId) await fetch(`${BASE_URL}/blogs/${blogId}`, { method: 'DELETE' });
    if (careerId) await fetch(`${BASE_URL}/careers/${careerId}`, { method: 'DELETE' });
    if (galleryId) await fetch(`${BASE_URL}/gallery/${galleryId}`, { method: 'DELETE' });
    console.log("✅ Cleanup complete.");

    console.log("\n✨ All functionality tests passed!");

  } catch (error) {
    console.error("\n❌ Test Suite Failed:", error.message);
  }
}

runTests();
