import requests
import unittest
import os

class TextifyAPITester(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super(TextifyAPITester, self).__init__(*args, **kwargs)
        # Get the backend URL from the frontend .env file
        self.base_url = "https://7f5adb25-faad-4ff6-a237-3fa82f6e13ec.preview.emergentagent.com"
        print(f"Testing API at: {self.base_url}")

    def test_health_endpoint(self):
        """Test the health check endpoint"""
        response = requests.get(f"{self.base_url}/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["message"], "Textify API is running")
        print("✅ Health endpoint test passed")

    def test_info_endpoint(self):
        """Test the API info endpoint"""
        response = requests.get(f"{self.base_url}/api/info")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "Textify API")
        self.assertEqual(data["version"], "1.0.0")
        self.assertTrue("features" in data)
        self.assertTrue(len(data["features"]) > 0)
        print("✅ Info endpoint test passed")

if __name__ == "__main__":
    tester = TextifyAPITester()
    print("Starting Textify API tests...")
    
    try:
        tester.test_health_endpoint()
        tester.test_info_endpoint()
        print("\n🎉 All API tests passed successfully!")
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")