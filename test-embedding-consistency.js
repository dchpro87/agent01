// Test script to verify embedding consistency between ADD_DOCUMENTS and QUERY_COLLECTION
// Run this in a browser console or Node.js environment with fetch available

async function testEmbeddingConsistency() {
  console.log(
    "🔍 Testing Embedding Consistency between ADD_DOCUMENTS and QUERY_COLLECTION"
  );
  console.log("=" * 80);

  // Test data
  const testCollection = "test-consistency-collection";
  const testDocuments = [
    "This is a test document about machine learning and artificial intelligence.",
    "Python is a programming language commonly used for data science and ML.",
    "ChromaDB is a vector database for storing and querying embeddings.",
  ];
  const testQuery = "What is machine learning?";

  try {
    // Step 1: Create collection with Ollama embedding
    console.log("\n1. Creating test collection with Ollama embedding...");
    const createResponse = await fetch(
      "http://localhost:3000/api/chromadb?action=create_collection&name=" +
        testCollection +
        "&ollama_embedding=true"
    );
    const createResult = await createResponse.json();
    console.log("Create Collection Result:", createResult);

    if (!createResult.success) {
      console.error("❌ Failed to create collection:", createResult.error);
      return;
    }

    // Step 2: Add documents with Ollama embedding
    console.log("\n2. Adding documents with Ollama embedding...");
    const addResponse = await fetch("http://localhost:3000/api/chromadb", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "add_documents",
        collection: testCollection,
        documents: testDocuments,
        ids: ["doc1", "doc2", "doc3"],
        generate_ollama_embeddings: true,
      }),
    });
    const addResult = await addResponse.json();
    console.log("Add Documents Result:", addResult);

    if (!addResult.success) {
      console.error("❌ Failed to add documents:", addResult.error);
      return;
    }

    // Step 3: Query collection with Ollama embedding
    console.log("\n3. Querying collection with Ollama embedding...");
    const queryResponse = await fetch("http://localhost:3000/api/chromadb", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "query_collection",
        collection: testCollection,
        query_texts: [testQuery],
        n_results: 3,
        generate_ollama_embeddings: true,
      }),
    });
    const queryResult = await queryResponse.json();
    console.log("Query Collection Result:", queryResult);

    if (!queryResult.success) {
      console.error("❌ Failed to query collection:", queryResult.error);
      return;
    }

    // Step 4: Analyze results
    console.log("\n4. Analyzing results...");
    console.log("Query:", testQuery);
    console.log("Results found:", queryResult.results.length);

    if (queryResult.results.length > 0) {
      queryResult.results.forEach((result, index) => {
        console.log(`\nResult ${index + 1}:`);
        console.log(`  ID: ${result.id}`);
        console.log(`  Document: ${result.document}`);
        console.log(`  Distance: ${result.distance}`);
      });

      // Check if the most relevant result makes sense
      const topResult = queryResult.results[0];
      console.log("\n📊 Top Result Analysis:");
      console.log(`  Top result: "${topResult.document}"`);
      console.log(`  Distance: ${topResult.distance}`);
      console.log(`  Expected: Should be most relevant to "${testQuery}"`);

      // A good result should have the ML document as the top result
      if (topResult.document.includes("machine learning")) {
        console.log(
          '✅ PASS: Top result contains "machine learning" - embedding consistency looks good'
        );
      } else {
        console.log(
          '❌ FAIL: Top result doesn\'t contain "machine learning" - possible embedding mismatch'
        );
      }
    } else {
      console.log("❌ FAIL: No results returned from query");
    }

    // Step 5: Cleanup
    console.log("\n5. Cleaning up test collection...");
    const deleteResponse = await fetch(
      "http://localhost:3000/api/chromadb?action=delete_collection&name=" +
        testCollection
    );
    const deleteResult = await deleteResponse.json();
    console.log("Delete Collection Result:", deleteResult);
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Also test if the embedding model is available
async function testEmbeddingModelAvailability() {
  console.log("\n🔍 Testing Embedding Model Availability");
  console.log("=" * 50);

  try {
    // Test if nomic-embed-text is available in Ollama
    const response = await fetch("http://192.168.0.145:11434/api/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nomic-embed-text",
        prompt: "test embedding",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ nomic-embed-text model is available");
      console.log(
        "✅ Embedding dimension:",
        result.embedding ? result.embedding.length : "unknown"
      );
    } else {
      console.log("❌ nomic-embed-text model is not available");
      console.log("Response status:", response.status);
      console.log("Response text:", await response.text());
    }
  } catch (error) {
    console.error("❌ Failed to test embedding model:", error);
  }
}

// Run tests
async function runTests() {
  await testEmbeddingModelAvailability();
  await testEmbeddingConsistency();
}

runTests();
