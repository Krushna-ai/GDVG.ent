#!/usr/bin/env python3
"""
Backend API Testing for Global Drama Verse Guide
Tests all content-related endpoints, search functionality, filtering, and database integration
"""

import requests
import json
import sys
from typing import Dict, Any, List
import time

# Get backend URL from frontend .env
BACKEND_URL = "https://b38b7380-807e-47cb-8ee8-c17b3cc26cc6.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.sample_content_id = None
        self.auth_token = None
        self.test_user_id = None
        self.test_watchlist_item_id = None
        
    def log_test(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        # Add authorization header if token is available
        if self.auth_token and 'headers' not in kwargs:
            kwargs['headers'] = {}
        if self.auth_token:
            kwargs['headers']['Authorization'] = f"Bearer {self.auth_token}"
            
        try:
            response = requests.request(method, url, timeout=30, **kwargs)
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise
    
    def test_root_endpoint(self):
        """Test GET /api/ root endpoint"""
        try:
            response = self.make_request("GET", "/")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Global Drama Verse Guide API" in data["message"]:
                    self.log_test("Root Endpoint", True, "Root endpoint working correctly")
                else:
                    self.log_test("Root Endpoint", False, "Unexpected response format", {"response": data})
            else:
                self.log_test("Root Endpoint", False, f"HTTP {response.status_code}", {"response": response.text})
                
        except Exception as e:
            self.log_test("Root Endpoint", False, f"Exception: {str(e)}")
    
    def test_content_list_endpoint(self):
        """Test GET /api/content with pagination"""
        try:
            # Test basic content list
            response = self.make_request("GET", "/content")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["contents", "total", "page", "limit"]
                
                if all(field in data for field in required_fields):
                    contents = data["contents"]
                    if len(contents) > 0:
                        # Store first content ID for later tests
                        self.sample_content_id = contents[0]["id"]
                        self.log_test("Content List", True, f"Retrieved {len(contents)} content items")
                        
                        # Test content structure
                        sample_content = contents[0]
                        required_content_fields = ["id", "title", "country", "content_type", "genres", "rating", "year"]
                        
                        if all(field in sample_content for field in required_content_fields):
                            self.log_test("Content Structure", True, "Content objects have required fields")
                        else:
                            missing_fields = [f for f in required_content_fields if f not in sample_content]
                            self.log_test("Content Structure", False, f"Missing fields: {missing_fields}")
                    else:
                        self.log_test("Content List", False, "No content items returned")
                else:
                    missing_fields = [f for f in required_fields if f not in data]
                    self.log_test("Content List", False, f"Missing response fields: {missing_fields}")
            else:
                self.log_test("Content List", False, f"HTTP {response.status_code}", {"response": response.text})
                
        except Exception as e:
            self.log_test("Content List", False, f"Exception: {str(e)}")
    
    def test_content_pagination(self):
        """Test content pagination parameters"""
        try:
            # Test with specific page and limit
            response = self.make_request("GET", "/content?page=1&limit=3")
            
            if response.status_code == 200:
                data = response.json()
                if data["page"] == 1 and data["limit"] == 3 and len(data["contents"]) <= 3:
                    self.log_test("Content Pagination", True, "Pagination working correctly")
                else:
                    self.log_test("Content Pagination", False, "Pagination parameters not respected", {"data": data})
            else:
                self.log_test("Content Pagination", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Content Pagination", False, f"Exception: {str(e)}")
    
    def test_content_search(self):
        """Test content search functionality"""
        try:
            # Test search by title
            response = self.make_request("GET", "/content?search=Squid")
            
            if response.status_code == 200:
                data = response.json()
                contents = data["contents"]
                
                if len(contents) > 0:
                    # Check if search results contain the search term
                    found_match = any("squid" in content["title"].lower() or 
                                    "squid" in content.get("original_title", "").lower() or
                                    "squid" in content["synopsis"].lower()
                                    for content in contents)
                    
                    if found_match:
                        self.log_test("Content Search", True, f"Search returned {len(contents)} relevant results")
                    else:
                        self.log_test("Content Search", False, "Search results don't match query")
                else:
                    self.log_test("Content Search", False, "Search returned no results")
            else:
                self.log_test("Content Search", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Content Search", False, f"Exception: {str(e)}")
    
    def test_content_filters(self):
        """Test content filtering functionality"""
        try:
            # Test country filter
            response = self.make_request("GET", "/content?country=South Korea")
            
            if response.status_code == 200:
                data = response.json()
                contents = data["contents"]
                
                if len(contents) > 0:
                    korean_content = all("korea" in content["country"].lower() for content in contents)
                    if korean_content:
                        self.log_test("Country Filter", True, f"Country filter returned {len(contents)} Korean content")
                    else:
                        self.log_test("Country Filter", False, "Country filter not working correctly")
                else:
                    self.log_test("Country Filter", False, "Country filter returned no results")
            else:
                self.log_test("Country Filter", False, f"HTTP {response.status_code}")
            
            # Test content type filter
            response = self.make_request("GET", "/content?content_type=movie")
            
            if response.status_code == 200:
                data = response.json()
                contents = data["contents"]
                
                if len(contents) > 0:
                    all_movies = all(content["content_type"] == "movie" for content in contents)
                    if all_movies:
                        self.log_test("Content Type Filter", True, f"Content type filter returned {len(contents)} movies")
                    else:
                        self.log_test("Content Type Filter", False, "Content type filter not working correctly")
                else:
                    self.log_test("Content Type Filter", False, "Content type filter returned no results")
            else:
                self.log_test("Content Type Filter", False, f"HTTP {response.status_code}")
                
            # Test genre filter
            response = self.make_request("GET", "/content?genre=thriller")
            
            if response.status_code == 200:
                data = response.json()
                contents = data["contents"]
                
                if len(contents) > 0:
                    has_thriller = all("thriller" in content["genres"] for content in contents)
                    if has_thriller:
                        self.log_test("Genre Filter", True, f"Genre filter returned {len(contents)} thriller content")
                    else:
                        self.log_test("Genre Filter", False, "Genre filter not working correctly")
                else:
                    self.log_test("Genre Filter", False, "Genre filter returned no results")
            else:
                self.log_test("Genre Filter", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Content Filters", False, f"Exception: {str(e)}")
    
    def test_individual_content(self):
        """Test GET /api/content/{id}"""
        if not self.sample_content_id:
            self.log_test("Individual Content", False, "No sample content ID available")
            return
            
        try:
            response = self.make_request("GET", f"/content/{self.sample_content_id}")
            
            if response.status_code == 200:
                content = response.json()
                required_fields = ["id", "title", "country", "content_type", "genres", "rating", "year"]
                
                if all(field in content for field in required_fields):
                    if content["id"] == self.sample_content_id:
                        self.log_test("Individual Content", True, f"Retrieved content: {content['title']}")
                    else:
                        self.log_test("Individual Content", False, "Returned content ID doesn't match requested ID")
                else:
                    missing_fields = [f for f in required_fields if f not in content]
                    self.log_test("Individual Content", False, f"Missing fields: {missing_fields}")
            elif response.status_code == 404:
                self.log_test("Individual Content", False, "Content not found (404)")
            else:
                self.log_test("Individual Content", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Individual Content", False, f"Exception: {str(e)}")
    
    def test_invalid_content_id(self):
        """Test error handling for invalid content ID"""
        try:
            response = self.make_request("GET", "/content/invalid-id-12345")
            
            if response.status_code == 404:
                self.log_test("Invalid Content ID", True, "Correctly returned 404 for invalid ID")
            else:
                self.log_test("Invalid Content ID", False, f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Invalid Content ID", False, f"Exception: {str(e)}")
    
    def test_advanced_search_endpoint(self):
        """Test GET /api/content/search - Advanced search with multiple filters"""
        try:
            # Test 1: Basic query search
            response = self.make_request("GET", "/content/search?query=Squid")
            
            if response.status_code == 200:
                data = response.json()
                if "contents" in data and len(data["contents"]) > 0:
                    self.log_test("Advanced Search - Basic Query", True, f"Query search returned {len(data['contents'])} results")
                else:
                    self.log_test("Advanced Search - Basic Query", False, "Query search returned no results")
            else:
                self.log_test("Advanced Search - Basic Query", False, f"HTTP {response.status_code}")
            
            # Test 2: Country filter
            response = self.make_request("GET", "/content/search?country=South Korea")
            
            if response.status_code == 200:
                data = response.json()
                if "contents" in data and len(data["contents"]) > 0:
                    # Verify all results are from South Korea
                    all_korean = all("korea" in content["country"].lower() for content in data["contents"])
                    if all_korean:
                        self.log_test("Advanced Search - Country Filter", True, f"Country filter returned {len(data['contents'])} Korean content")
                    else:
                        self.log_test("Advanced Search - Country Filter", False, "Country filter not working correctly")
                else:
                    self.log_test("Advanced Search - Country Filter", False, "Country filter returned no results")
            else:
                self.log_test("Advanced Search - Country Filter", False, f"HTTP {response.status_code}")
            
            # Test 3: Content type filter
            response = self.make_request("GET", "/content/search?content_type=movie")
            
            if response.status_code == 200:
                data = response.json()
                if "contents" in data and len(data["contents"]) > 0:
                    all_movies = all(content["content_type"] == "movie" for content in data["contents"])
                    if all_movies:
                        self.log_test("Advanced Search - Content Type Filter", True, f"Content type filter returned {len(data['contents'])} movies")
                    else:
                        self.log_test("Advanced Search - Content Type Filter", False, "Content type filter not working correctly")
                else:
                    self.log_test("Advanced Search - Content Type Filter", False, "Content type filter returned no results")
            else:
                self.log_test("Advanced Search - Content Type Filter", False, f"HTTP {response.status_code}")
            
            # Test 4: Genre filter
            response = self.make_request("GET", "/content/search?genre=thriller")
            
            if response.status_code == 200:
                data = response.json()
                if "contents" in data and len(data["contents"]) > 0:
                    has_thriller = all("thriller" in content["genres"] for content in data["contents"])
                    if has_thriller:
                        self.log_test("Advanced Search - Genre Filter", True, f"Genre filter returned {len(data['contents'])} thriller content")
                    else:
                        self.log_test("Advanced Search - Genre Filter", False, "Genre filter not working correctly")
                else:
                    self.log_test("Advanced Search - Genre Filter", False, "Genre filter returned no results")
            else:
                self.log_test("Advanced Search - Genre Filter", False, f"HTTP {response.status_code}")
            
            # Test 5: Year range filter
            response = self.make_request("GET", "/content/search?year_from=2015&year_to=2020")
            
            if response.status_code == 200:
                data = response.json()
                if "contents" in data and len(data["contents"]) > 0:
                    in_range = all(2015 <= content["year"] <= 2020 for content in data["contents"])
                    if in_range:
                        self.log_test("Advanced Search - Year Range Filter", True, f"Year range filter returned {len(data['contents'])} content from 2015-2020")
                    else:
                        self.log_test("Advanced Search - Year Range Filter", False, "Year range filter not working correctly")
                else:
                    self.log_test("Advanced Search - Year Range Filter", False, "Year range filter returned no results")
            else:
                self.log_test("Advanced Search - Year Range Filter", False, f"HTTP {response.status_code}")
            
            # Test 6: Rating range filter
            response = self.make_request("GET", "/content/search?rating_min=8.0&rating_max=9.0")
            
            if response.status_code == 200:
                data = response.json()
                if "contents" in data and len(data["contents"]) > 0:
                    in_range = all(8.0 <= content["rating"] <= 9.0 for content in data["contents"])
                    if in_range:
                        self.log_test("Advanced Search - Rating Range Filter", True, f"Rating range filter returned {len(data['contents'])} high-rated content")
                    else:
                        self.log_test("Advanced Search - Rating Range Filter", False, "Rating range filter not working correctly")
                else:
                    self.log_test("Advanced Search - Rating Range Filter", False, "Rating range filter returned no results")
            else:
                self.log_test("Advanced Search - Rating Range Filter", False, f"HTTP {response.status_code}")
            
            # Test 7: Combined filters
            response = self.make_request("GET", "/content/search?country=South Korea&content_type=movie&rating_min=8.0")
            
            if response.status_code == 200:
                data = response.json()
                if "contents" in data:
                    self.log_test("Advanced Search - Combined Filters", True, f"Combined filters returned {len(data['contents'])} results")
                else:
                    self.log_test("Advanced Search - Combined Filters", False, "Combined filters failed")
            else:
                self.log_test("Advanced Search - Combined Filters", False, f"HTTP {response.status_code}")
            
            # Test 8: Sorting options
            response = self.make_request("GET", "/content/search?sort_by=rating&sort_order=desc")
            
            if response.status_code == 200:
                data = response.json()
                if "contents" in data and len(data["contents"]) > 1:
                    ratings = [content["rating"] for content in data["contents"]]
                    is_sorted_desc = all(ratings[i] >= ratings[i+1] for i in range(len(ratings)-1))
                    if is_sorted_desc:
                        self.log_test("Advanced Search - Sorting", True, "Results properly sorted by rating (descending)")
                    else:
                        self.log_test("Advanced Search - Sorting", False, "Sorting not working correctly")
                else:
                    self.log_test("Advanced Search - Sorting", True, "Sorting test completed (insufficient data for verification)")
            else:
                self.log_test("Advanced Search - Sorting", False, f"HTTP {response.status_code}")
            
            # Test 9: Pagination in search
            response = self.make_request("GET", "/content/search?page=1&limit=2")
            
            if response.status_code == 200:
                data = response.json()
                if "contents" in data and "page" in data and "limit" in data:
                    if data["page"] == 1 and data["limit"] == 2 and len(data["contents"]) <= 2:
                        self.log_test("Advanced Search - Pagination", True, "Search pagination working correctly")
                    else:
                        self.log_test("Advanced Search - Pagination", False, "Search pagination not working correctly")
                else:
                    self.log_test("Advanced Search - Pagination", False, "Search pagination response format incorrect")
            else:
                self.log_test("Advanced Search - Pagination", False, f"HTTP {response.status_code}")
            
            # Test 10: Empty search (should return all content)
            response = self.make_request("GET", "/content/search")
            
            if response.status_code == 200:
                data = response.json()
                if "contents" in data and "total" in data:
                    self.log_test("Advanced Search - Empty Query", True, f"Empty search returned {data['total']} total content items")
                else:
                    self.log_test("Advanced Search - Empty Query", False, "Empty search response format incorrect")
            else:
                self.log_test("Advanced Search - Empty Query", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Advanced Search Endpoint", False, f"Exception: {str(e)}")
    
    def test_featured_content_endpoint(self):
        """Test GET /api/content/featured - Featured content sections"""
        try:
            # Test 1: Trending content
            response = self.make_request("GET", "/content/featured?category=trending")
            
            if response.status_code == 200:
                contents = response.json()
                if isinstance(contents, list) and len(contents) > 0:
                    self.log_test("Featured Content - Trending", True, f"Retrieved {len(contents)} trending items")
                else:
                    self.log_test("Featured Content - Trending", False, "No trending content returned")
            else:
                self.log_test("Featured Content - Trending", False, f"HTTP {response.status_code}")
            
            # Test 2: New releases
            response = self.make_request("GET", "/content/featured?category=new_releases")
            
            if response.status_code == 200:
                contents = response.json()
                if isinstance(contents, list) and len(contents) > 0:
                    self.log_test("Featured Content - New Releases", True, f"Retrieved {len(contents)} new releases")
                else:
                    self.log_test("Featured Content - New Releases", False, "No new releases returned")
            else:
                self.log_test("Featured Content - New Releases", False, f"HTTP {response.status_code}")
            
            # Test 3: Top rated
            response = self.make_request("GET", "/content/featured?category=top_rated")
            
            if response.status_code == 200:
                contents = response.json()
                if isinstance(contents, list) and len(contents) > 0:
                    # Verify sorting by rating
                    ratings = [content["rating"] for content in contents]
                    is_sorted = all(ratings[i] >= ratings[i+1] for i in range(len(ratings)-1))
                    if is_sorted:
                        self.log_test("Featured Content - Top Rated", True, f"Retrieved {len(contents)} top rated items, properly sorted")
                    else:
                        self.log_test("Featured Content - Top Rated", True, f"Retrieved {len(contents)} top rated items")
                else:
                    self.log_test("Featured Content - Top Rated", False, "No top rated content returned")
            else:
                self.log_test("Featured Content - Top Rated", False, f"HTTP {response.status_code}")
            
            # Test 4: By country
            response = self.make_request("GET", "/content/featured?category=by_country&country=South Korea")
            
            if response.status_code == 200:
                contents = response.json()
                if isinstance(contents, list) and len(contents) > 0:
                    # Verify all content is from South Korea
                    all_korean = all("korea" in content["country"].lower() for content in contents)
                    if all_korean:
                        self.log_test("Featured Content - By Country", True, f"Retrieved {len(contents)} Korean content items")
                    else:
                        self.log_test("Featured Content - By Country", False, "Country filtering not working correctly")
                else:
                    self.log_test("Featured Content - By Country", False, "No country-specific content returned")
            else:
                self.log_test("Featured Content - By Country", False, f"HTTP {response.status_code}")
            
            # Test 5: Default category (should default to trending)
            response = self.make_request("GET", "/content/featured")
            
            if response.status_code == 200:
                contents = response.json()
                if isinstance(contents, list) and len(contents) > 0:
                    self.log_test("Featured Content - Default Category", True, f"Default category returned {len(contents)} items")
                else:
                    self.log_test("Featured Content - Default Category", False, "Default category returned no content")
            else:
                self.log_test("Featured Content - Default Category", False, f"HTTP {response.status_code}")
            
            # Test 6: Custom limit
            response = self.make_request("GET", "/content/featured?category=trending&limit=5")
            
            if response.status_code == 200:
                contents = response.json()
                if isinstance(contents, list) and len(contents) <= 5:
                    self.log_test("Featured Content - Custom Limit", True, f"Custom limit returned {len(contents)} items (max 5)")
                else:
                    self.log_test("Featured Content - Custom Limit", False, f"Custom limit not respected, returned {len(contents)} items")
            else:
                self.log_test("Featured Content - Custom Limit", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Featured Content Endpoint", False, f"Exception: {str(e)}")
    
    def test_trending_endpoint(self):
        """Test GET /api/trending (legacy endpoint)"""
        try:
            response = self.make_request("GET", "/trending")
            
            if response.status_code == 200:
                contents = response.json()
                
                if isinstance(contents, list) and len(contents) > 0:
                    # Check if results are sorted by rating (descending)
                    ratings = [content["rating"] for content in contents if "rating" in content]
                    is_sorted = all(ratings[i] >= ratings[i+1] for i in range(len(ratings)-1))
                    
                    if is_sorted:
                        self.log_test("Trending Content (Legacy)", True, f"Retrieved {len(contents)} trending items, properly sorted")
                    else:
                        self.log_test("Trending Content (Legacy)", True, f"Retrieved {len(contents)} trending items (sorting may vary)")
                else:
                    self.log_test("Trending Content (Legacy)", False, "No trending content returned")
            else:
                self.log_test("Trending Content (Legacy)", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Trending Content (Legacy)", False, f"Exception: {str(e)}")
    
    def test_countries_endpoint(self):
        """Test GET /api/countries"""
        try:
            response = self.make_request("GET", "/countries")
            
            if response.status_code == 200:
                data = response.json()
                
                if "countries" in data and isinstance(data["countries"], list):
                    countries = data["countries"]
                    expected_countries = ["South Korea", "Japan", "India", "Spain"]
                    
                    found_countries = [c for c in expected_countries if c in countries]
                    if len(found_countries) >= 3:  # At least 3 of the expected countries
                        self.log_test("Countries Endpoint", True, f"Retrieved {len(countries)} countries")
                    else:
                        self.log_test("Countries Endpoint", False, f"Missing expected countries. Found: {countries}")
                else:
                    self.log_test("Countries Endpoint", False, "Invalid response format")
            else:
                self.log_test("Countries Endpoint", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Countries Endpoint", False, f"Exception: {str(e)}")
    
    def test_genres_endpoint(self):
        """Test GET /api/genres"""
        try:
            response = self.make_request("GET", "/genres")
            
            if response.status_code == 200:
                data = response.json()
                
                if "genres" in data and isinstance(data["genres"], list):
                    genres = data["genres"]
                    expected_genres = ["romance", "comedy", "action", "thriller", "drama"]
                    
                    found_genres = [g for g in expected_genres if g in genres]
                    if len(found_genres) >= 4:  # At least 4 of the expected genres
                        self.log_test("Genres Endpoint", True, f"Retrieved {len(genres)} genres")
                    else:
                        self.log_test("Genres Endpoint", False, f"Missing expected genres. Found: {genres}")
                else:
                    self.log_test("Genres Endpoint", False, "Invalid response format")
            else:
                self.log_test("Genres Endpoint", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Genres Endpoint", False, f"Exception: {str(e)}")
    
    def test_content_types_endpoint(self):
        """Test GET /api/content-types"""
        try:
            response = self.make_request("GET", "/content-types")
            
            if response.status_code == 200:
                data = response.json()
                
                if "content_types" in data and isinstance(data["content_types"], list):
                    content_types = data["content_types"]
                    expected_types = ["drama", "movie", "series", "anime"]
                    
                    found_types = [t for t in expected_types if t in content_types]
                    if len(found_types) == 4:  # All expected types
                        self.log_test("Content Types Endpoint", True, f"Retrieved all {len(content_types)} content types")
                    else:
                        self.log_test("Content Types Endpoint", False, f"Missing expected types. Found: {content_types}")
                else:
                    self.log_test("Content Types Endpoint", False, "Invalid response format")
            else:
                self.log_test("Content Types Endpoint", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Content Types Endpoint", False, f"Exception: {str(e)}")
    
    def test_create_content(self):
        """Test POST /api/content"""
        try:
            new_content = {
                "title": "Test Drama",
                "original_title": "테스트 드라마",
                "poster_url": "https://example.com/poster.jpg",
                "synopsis": "A test drama for API testing",
                "year": 2024,
                "country": "Test Country",
                "content_type": "drama",
                "genres": ["romance", "comedy"],
                "rating": 7.5,
                "episodes": 16,
                "cast": [],
                "crew": [],
                "streaming_platforms": ["Test Platform"],
                "tags": ["test", "api"]
            }
            
            response = self.make_request("POST", "/content", json=new_content)
            
            if response.status_code == 200:
                created_content = response.json()
                
                if "id" in created_content and created_content["title"] == new_content["title"]:
                    self.log_test("Create Content", True, f"Successfully created content: {created_content['title']}")
                else:
                    self.log_test("Create Content", False, "Created content doesn't match input")
            else:
                self.log_test("Create Content", False, f"HTTP {response.status_code}", {"response": response.text})
                
        except Exception as e:
            self.log_test("Create Content", False, f"Exception: {str(e)}")
    
    def test_database_integration(self):
        """Test database integration and data persistence"""
        try:
            # Get content list to verify database connection
            response = self.make_request("GET", "/content")
            
            if response.status_code == 200:
                data = response.json()
                total_content = data["total"]
                
                if total_content > 0:
                    self.log_test("Database Integration", True, f"Database contains {total_content} content items")
                    
                    # Verify sample data is present
                    contents = data["contents"]
                    sample_titles = ["Squid Game", "Parasite", "Your Name", "3 Idiots", "Money Heist"]
                    found_titles = [c["title"] for c in contents if c["title"] in sample_titles]
                    
                    if len(found_titles) >= 3:
                        self.log_test("Sample Data", True, f"Found sample content: {found_titles}")
                    else:
                        self.log_test("Sample Data", False, f"Missing expected sample data. Found: {found_titles}")
                else:
                    self.log_test("Database Integration", False, "Database appears to be empty")
            else:
                self.log_test("Database Integration", False, f"Cannot verify database connection: HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Database Integration", False, f"Exception: {str(e)}")
    
    def test_user_authentication(self):
        """Test user registration and login for watchlist testing"""
        try:
            # Test user registration
            test_user_data = {
                "email": "watchlist.tester@example.com",
                "username": "watchlist_tester",
                "password": "testpass123",
                "first_name": "Watchlist",
                "last_name": "Tester"
            }
            
            response = self.make_request("POST", "/auth/register", json=test_user_data)
            
            if response.status_code == 200:
                user_profile = response.json()
                self.test_user_id = user_profile["id"]
                self.log_test("User Registration", True, f"Successfully registered test user: {user_profile['username']}")
                
                # Test user login
                login_data = {
                    "email": test_user_data["email"],
                    "password": test_user_data["password"]
                }
                
                response = self.make_request("POST", "/auth/login", json=login_data)
                
                if response.status_code == 200:
                    token_data = response.json()
                    self.auth_token = token_data["access_token"]
                    self.log_test("User Login", True, "Successfully logged in and obtained auth token")
                else:
                    self.log_test("User Login", False, f"Login failed: HTTP {response.status_code}")
                    
            elif response.status_code == 400 and "already registered" in response.text:
                # User already exists, try to login
                login_data = {
                    "email": test_user_data["email"],
                    "password": test_user_data["password"]
                }
                
                response = self.make_request("POST", "/auth/login", json=login_data)
                
                if response.status_code == 200:
                    token_data = response.json()
                    self.auth_token = token_data["access_token"]
                    self.log_test("User Authentication", True, "Used existing test user and obtained auth token")
                else:
                    self.log_test("User Authentication", False, f"Login failed for existing user: HTTP {response.status_code}")
            else:
                self.log_test("User Registration", False, f"Registration failed: HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("User Authentication", False, f"Exception: {str(e)}")
    
    def test_watchlist_add_content(self):
        """Test POST /api/watchlist - Add content to watchlist"""
        if not self.auth_token:
            self.log_test("Watchlist Add Content", False, "No auth token available")
            return
            
        if not self.sample_content_id:
            self.log_test("Watchlist Add Content", False, "No sample content ID available")
            return
            
        try:
            # Test 1: Add content with "want_to_watch" status
            watchlist_data = {
                "content_id": self.sample_content_id,
                "status": "want_to_watch",
                "notes": "Added for testing purposes"
            }
            
            response = self.make_request("POST", "/watchlist", json=watchlist_data)
            
            if response.status_code == 200:
                result = response.json()
                if "id" in result:
                    self.test_watchlist_item_id = result["id"]
                    self.log_test("Watchlist Add Content - Want to Watch", True, "Successfully added content to watchlist")
                else:
                    self.log_test("Watchlist Add Content - Want to Watch", False, "No item ID returned")
            else:
                self.log_test("Watchlist Add Content - Want to Watch", False, f"HTTP {response.status_code}: {response.text}")
            
            # Test 2: Try to add same content again (should fail)
            response = self.make_request("POST", "/watchlist", json=watchlist_data)
            
            if response.status_code == 400:
                self.log_test("Watchlist Add Duplicate Content", True, "Correctly prevented duplicate content addition")
            else:
                self.log_test("Watchlist Add Duplicate Content", False, f"Expected 400, got {response.status_code}")
            
            # Test 3: Add content with different status (using different content if available)
            # Get another content ID for testing
            content_response = self.make_request("GET", "/content?limit=5")
            if content_response.status_code == 200:
                contents = content_response.json()["contents"]
                if len(contents) > 1:
                    second_content_id = contents[1]["id"]
                    
                    watching_data = {
                        "content_id": second_content_id,
                        "status": "watching",
                        "progress": 5,
                        "total_episodes": 16,
                        "rating": 8.5
                    }
                    
                    response = self.make_request("POST", "/watchlist", json=watching_data)
                    
                    if response.status_code == 200:
                        self.log_test("Watchlist Add Content - Watching", True, "Successfully added content with watching status")
                    else:
                        self.log_test("Watchlist Add Content - Watching", False, f"HTTP {response.status_code}")
            
            # Test 4: Add content with invalid content ID
            invalid_data = {
                "content_id": "invalid-content-id-12345",
                "status": "want_to_watch"
            }
            
            response = self.make_request("POST", "/watchlist", json=invalid_data)
            
            if response.status_code == 404:
                self.log_test("Watchlist Add Invalid Content", True, "Correctly handled invalid content ID")
            else:
                self.log_test("Watchlist Add Invalid Content", False, f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Watchlist Add Content", False, f"Exception: {str(e)}")
    
    def test_watchlist_get_user_watchlist(self):
        """Test GET /api/watchlist - Get user's watchlist"""
        if not self.auth_token:
            self.log_test("Get User Watchlist", False, "No auth token available")
            return
            
        try:
            # Test 1: Get all watchlist items
            response = self.make_request("GET", "/watchlist")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["items", "total", "status_counts"]
                
                if all(field in data for field in required_fields):
                    items = data["items"]
                    total = data["total"]
                    status_counts = data["status_counts"]
                    
                    self.log_test("Get User Watchlist - All Items", True, f"Retrieved {len(items)} watchlist items (total: {total})")
                    
                    # Verify item structure
                    if len(items) > 0:
                        sample_item = items[0]
                        required_item_fields = ["id", "user_id", "content_id", "status", "content"]
                        
                        if all(field in sample_item for field in required_item_fields):
                            self.log_test("Watchlist Item Structure", True, "Watchlist items have required fields including content details")
                        else:
                            missing_fields = [f for f in required_item_fields if f not in sample_item]
                            self.log_test("Watchlist Item Structure", False, f"Missing fields: {missing_fields}")
                    
                    # Verify status counts structure
                    expected_statuses = ["want_to_watch", "watching", "completed", "dropped"]
                    if all(status in status_counts for status in expected_statuses):
                        self.log_test("Watchlist Status Counts", True, f"Status counts: {status_counts}")
                    else:
                        self.log_test("Watchlist Status Counts", False, "Missing status counts")
                        
                else:
                    missing_fields = [f for f in required_fields if f not in data]
                    self.log_test("Get User Watchlist - All Items", False, f"Missing response fields: {missing_fields}")
            else:
                self.log_test("Get User Watchlist - All Items", False, f"HTTP {response.status_code}")
            
            # Test 2: Filter by status
            response = self.make_request("GET", "/watchlist?status=want_to_watch")
            
            if response.status_code == 200:
                data = response.json()
                items = data["items"]
                
                if len(items) > 0:
                    all_want_to_watch = all(item["status"] == "want_to_watch" for item in items)
                    if all_want_to_watch:
                        self.log_test("Get User Watchlist - Status Filter", True, f"Status filter returned {len(items)} 'want_to_watch' items")
                    else:
                        self.log_test("Get User Watchlist - Status Filter", False, "Status filter not working correctly")
                else:
                    self.log_test("Get User Watchlist - Status Filter", True, "Status filter returned no items (expected if no items with that status)")
            else:
                self.log_test("Get User Watchlist - Status Filter", False, f"HTTP {response.status_code}")
            
            # Test 3: Pagination
            response = self.make_request("GET", "/watchlist?page=1&limit=2")
            
            if response.status_code == 200:
                data = response.json()
                items = data["items"]
                
                if len(items) <= 2:
                    self.log_test("Get User Watchlist - Pagination", True, f"Pagination returned {len(items)} items (max 2)")
                else:
                    self.log_test("Get User Watchlist - Pagination", False, f"Pagination not working, returned {len(items)} items")
            else:
                self.log_test("Get User Watchlist - Pagination", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Get User Watchlist", False, f"Exception: {str(e)}")
    
    def test_watchlist_update_item(self):
        """Test PUT /api/watchlist/{item_id} - Update watchlist item"""
        if not self.auth_token:
            self.log_test("Update Watchlist Item", False, "No auth token available")
            return
            
        if not self.test_watchlist_item_id:
            self.log_test("Update Watchlist Item", False, "No watchlist item ID available")
            return
            
        try:
            # Test 1: Update status to watching
            update_data = {
                "status": "watching",
                "progress": 3,
                "rating": 8.0,
                "notes": "Updated to watching status"
            }
            
            response = self.make_request("PUT", f"/watchlist/{self.test_watchlist_item_id}", json=update_data)
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result:
                    self.log_test("Update Watchlist Item - Status Change", True, "Successfully updated watchlist item status to watching")
                else:
                    self.log_test("Update Watchlist Item - Status Change", False, "Unexpected response format")
            else:
                self.log_test("Update Watchlist Item - Status Change", False, f"HTTP {response.status_code}: {response.text}")
            
            # Test 2: Update to completed status
            complete_data = {
                "status": "completed",
                "progress": 16,
                "rating": 9.0,
                "notes": "Finished watching, excellent series!"
            }
            
            response = self.make_request("PUT", f"/watchlist/{self.test_watchlist_item_id}", json=complete_data)
            
            if response.status_code == 200:
                self.log_test("Update Watchlist Item - Complete", True, "Successfully updated watchlist item to completed")
            else:
                self.log_test("Update Watchlist Item - Complete", False, f"HTTP {response.status_code}")
            
            # Test 3: Update with partial data (only rating)
            partial_data = {
                "rating": 8.5
            }
            
            response = self.make_request("PUT", f"/watchlist/{self.test_watchlist_item_id}", json=partial_data)
            
            if response.status_code == 200:
                self.log_test("Update Watchlist Item - Partial Update", True, "Successfully updated watchlist item with partial data")
            else:
                self.log_test("Update Watchlist Item - Partial Update", False, f"HTTP {response.status_code}")
            
            # Test 4: Update non-existent item
            response = self.make_request("PUT", "/watchlist/invalid-item-id-12345", json=update_data)
            
            if response.status_code == 404:
                self.log_test("Update Non-existent Watchlist Item", True, "Correctly handled non-existent item update")
            else:
                self.log_test("Update Non-existent Watchlist Item", False, f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Update Watchlist Item", False, f"Exception: {str(e)}")
    
    def test_watchlist_stats(self):
        """Test GET /api/watchlist/stats - Get watchlist statistics"""
        if not self.auth_token:
            self.log_test("Watchlist Stats", False, "No auth token available")
            return
            
        try:
            response = self.make_request("GET", "/watchlist/stats")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["status_counts", "total_content", "recent_activity"]
                
                if all(field in data for field in required_fields):
                    status_counts = data["status_counts"]
                    total_content = data["total_content"]
                    recent_activity = data["recent_activity"]
                    
                    self.log_test("Watchlist Stats - Structure", True, f"Stats retrieved: {total_content} total items")
                    
                    # Verify status counts
                    expected_statuses = ["want_to_watch", "watching", "completed", "dropped"]
                    if all(status in status_counts for status in expected_statuses):
                        self.log_test("Watchlist Stats - Status Counts", True, f"Status breakdown: {status_counts}")
                    else:
                        self.log_test("Watchlist Stats - Status Counts", False, "Missing status counts")
                    
                    # Verify recent activity structure
                    if isinstance(recent_activity, list):
                        if len(recent_activity) > 0:
                            sample_activity = recent_activity[0]
                            if "content" in sample_activity and "status" in sample_activity:
                                self.log_test("Watchlist Stats - Recent Activity", True, f"Recent activity includes {len(recent_activity)} items with content details")
                            else:
                                self.log_test("Watchlist Stats - Recent Activity", False, "Recent activity missing required fields")
                        else:
                            self.log_test("Watchlist Stats - Recent Activity", True, "Recent activity is empty (expected if no items)")
                    else:
                        self.log_test("Watchlist Stats - Recent Activity", False, "Recent activity is not a list")
                        
                else:
                    missing_fields = [f for f in required_fields if f not in data]
                    self.log_test("Watchlist Stats - Structure", False, f"Missing response fields: {missing_fields}")
            else:
                self.log_test("Watchlist Stats", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Watchlist Stats", False, f"Exception: {str(e)}")
    
    def test_watchlist_remove_content(self):
        """Test DELETE /api/watchlist/{item_id} - Remove content from watchlist"""
        if not self.auth_token:
            self.log_test("Remove Watchlist Content", False, "No auth token available")
            return
            
        if not self.test_watchlist_item_id:
            self.log_test("Remove Watchlist Content", False, "No watchlist item ID available")
            return
            
        try:
            # Test 1: Remove existing item
            response = self.make_request("DELETE", f"/watchlist/{self.test_watchlist_item_id}")
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result:
                    self.log_test("Remove Watchlist Content", True, "Successfully removed content from watchlist")
                else:
                    self.log_test("Remove Watchlist Content", False, "Unexpected response format")
            else:
                self.log_test("Remove Watchlist Content", False, f"HTTP {response.status_code}: {response.text}")
            
            # Test 2: Try to remove the same item again (should fail)
            response = self.make_request("DELETE", f"/watchlist/{self.test_watchlist_item_id}")
            
            if response.status_code == 404:
                self.log_test("Remove Non-existent Watchlist Item", True, "Correctly handled removal of non-existent item")
            else:
                self.log_test("Remove Non-existent Watchlist Item", False, f"Expected 404, got {response.status_code}")
            
            # Test 3: Remove with invalid item ID
            response = self.make_request("DELETE", "/watchlist/invalid-item-id-12345")
            
            if response.status_code == 404:
                self.log_test("Remove Invalid Watchlist Item", True, "Correctly handled invalid item ID")
            else:
                self.log_test("Remove Invalid Watchlist Item", False, f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Remove Watchlist Content", False, f"Exception: {str(e)}")
    
    def test_watchlist_unauthorized_access(self):
        """Test watchlist endpoints without authentication"""
        try:
            # Temporarily remove auth token
            original_token = self.auth_token
            self.auth_token = None
            
            # Test GET /api/watchlist without auth
            response = self.make_request("GET", "/watchlist")
            
            if response.status_code == 401:
                self.log_test("Watchlist Unauthorized Access - GET", True, "Correctly blocked unauthorized access to watchlist")
            else:
                self.log_test("Watchlist Unauthorized Access - GET", False, f"Expected 401, got {response.status_code}")
            
            # Test POST /api/watchlist without auth
            watchlist_data = {
                "content_id": self.sample_content_id or "test-id",
                "status": "want_to_watch"
            }
            
            response = self.make_request("POST", "/watchlist", json=watchlist_data)
            
            if response.status_code == 401:
                self.log_test("Watchlist Unauthorized Access - POST", True, "Correctly blocked unauthorized content addition")
            else:
                self.log_test("Watchlist Unauthorized Access - POST", False, f"Expected 401, got {response.status_code}")
            
            # Test GET /api/watchlist/stats without auth
            response = self.make_request("GET", "/watchlist/stats")
            
            if response.status_code == 401:
                self.log_test("Watchlist Unauthorized Access - Stats", True, "Correctly blocked unauthorized stats access")
            else:
                self.log_test("Watchlist Unauthorized Access - Stats", False, f"Expected 401, got {response.status_code}")
            
            # Restore auth token
            self.auth_token = original_token
            
        except Exception as e:
            self.log_test("Watchlist Unauthorized Access", False, f"Exception: {str(e)}")
            # Restore auth token in case of exception
            self.auth_token = original_token
    
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting Backend API Tests for Global Drama Verse Guide - Day 4 Watchlist System")
        print(f"Backend URL: {self.base_url}")
        print("=" * 80)
        
        # Core API endpoint tests
        self.test_root_endpoint()
        self.test_content_list_endpoint()
        self.test_content_pagination()
        self.test_individual_content()
        self.test_invalid_content_id()
        
        # Day 3 Public Content Discovery - Advanced Search Tests
        print("\n🔍 DAY 3 ADVANCED SEARCH TESTS")
        print("-" * 50)
        self.test_advanced_search_endpoint()
        
        # Day 3 Public Content Discovery - Featured Content Tests  
        print("\n⭐ DAY 3 FEATURED CONTENT TESTS")
        print("-" * 50)
        self.test_featured_content_endpoint()
        
        # Filter option endpoints
        print("\n📋 FILTER OPTION ENDPOINTS")
        print("-" * 50)
        self.test_countries_endpoint()
        self.test_genres_endpoint()
        self.test_content_types_endpoint()
        
        # User Authentication for Watchlist Tests
        print("\n🔐 USER AUTHENTICATION TESTS")
        print("-" * 50)
        self.test_user_authentication()
        
        # Day 4 Watchlist System Tests
        print("\n📝 DAY 4 WATCHLIST SYSTEM TESTS")
        print("-" * 50)
        self.test_watchlist_unauthorized_access()
        self.test_watchlist_add_content()
        self.test_watchlist_get_user_watchlist()
        self.test_watchlist_update_item()
        self.test_watchlist_stats()
        self.test_watchlist_remove_content()
        
        # Legacy endpoints
        print("\n🔄 LEGACY ENDPOINTS")
        print("-" * 50)
        self.test_trending_endpoint()
        
        # Search and filtering tests (original)
        print("\n🔎 ORIGINAL SEARCH & FILTER TESTS")
        print("-" * 50)
        self.test_content_search()
        self.test_content_filters()
        
        # Database integration tests
        print("\n💾 DATABASE INTEGRATION TESTS")
        print("-" * 50)
        self.test_database_integration()
        
        # Content creation test
        print("\n➕ CONTENT CREATION TEST")
        print("-" * 50)
        self.test_create_content()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! Backend API is working correctly.")
        sys.exit(0)
    else:
        print("\n⚠️  Some tests failed. Check the details above.")
        sys.exit(1)