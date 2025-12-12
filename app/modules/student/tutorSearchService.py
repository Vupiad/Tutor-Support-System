
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from app.data_manager import DatacoreManager
import numpy as np
import json

lecturers_data = DatacoreManager.get_all_tutors()

model = SentenceTransformer('all-MiniLM-L6-v2')

lecturer_texts = []

for l in lecturers_data:
    # Combine bio, subjects, and qualifications into one string
    subjects_str = ", ".join(l.get("subjects", []))
    qual_str = ", ".join(l.get("qualifications", []))
    bio_str = l.get("bio", "")
    
    # This string represents the "meaning" of the lecturer
    combined_text = f"{bio_str} Subjects: {subjects_str} Qualifications: {qual_str}"
    lecturer_texts.append(combined_text)

lecturer_embeddings = model.encode(lecturer_texts)

async def search_tutors_by_meaning(query, top_k=5):
    query_embedding = model.encode([query])
    
    similarities = cosine_similarity(query_embedding, lecturer_embeddings)[0]
    
    top_k_indices = np.argsort(similarities)[-top_k:][::-1]
    
    results = []
    for idx in top_k_indices:
        tutor_info = lecturers_data[idx].copy()
        tutor_info["similarity_score"] = float(similarities[idx])
        results.append(tutor_info)
    
    return results


if __name__ == "__main__":
    test_query = "Introduction to Algorithms"
    import asyncio
    results = asyncio.run(search_tutors_by_meaning(test_query, top_k=3))
    print(json.dumps(results, indent=2))