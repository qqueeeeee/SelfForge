#!/usr/bin/env python3
"""
SelfForge Backend API Verification Script

This script tests all the API endpoints to verify the backend is working correctly.
Run this while the backend server is running to verify functionality.

Usage:
    python verify_api.py
"""

import json
import time
from datetime import datetime, timedelta
from typing import Any, Dict

import requests


class APIVerifier:
    def __init__(self, base_url: str = "http://127.0.0.1:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []

    def log_test(self, test_name: str, success: bool, message: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")

        self.test_results.append(
            {"test": test_name, "success": success, "message": message}
        )

    def test_health(self) -> bool:
        """Test health endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Health Check", True, f"Version: {data.get('version', 'unknown')}"
                )
                print(f"    Features: {data.get('features', {})}")
                return True
            else:
                self.log_test(
                    "Health Check", False, f"Status code: {response.status_code}"
                )
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            return False

    def test_calendar_endpoints(self) -> bool:
        """Test calendar CRUD operations"""
        tests_passed = 0
        total_tests = 4

        # Test 1: Get all calendar items (should be empty initially)
        try:
            response = self.session.get(f"{self.base_url}/calendar/items")
            if response.status_code == 200:
                items = response.json()
                self.log_test("Get Calendar Items", True, f"Found {len(items)} items")
                tests_passed += 1
            else:
                self.log_test(
                    "Get Calendar Items", False, f"Status: {response.status_code}"
                )
        except Exception as e:
            self.log_test("Get Calendar Items", False, str(e))

        # Test 2: Create a calendar task
        task_data = {
            "title": "Test Task",
            "description": "API verification task",
            "start_datetime": datetime.now().isoformat(),
            "end_datetime": (datetime.now() + timedelta(hours=1)).isoformat(),
            "category": "work",
            "item_type": "task",
            "priority": "medium",
        }

        created_task_id = None
        try:
            response = self.session.post(
                f"{self.base_url}/calendar/items", json=task_data
            )
            if response.status_code == 200:
                created_task = response.json()
                created_task_id = created_task.get("id")
                self.log_test(
                    "Create Calendar Task", True, f"Created task ID: {created_task_id}"
                )
                tests_passed += 1
            else:
                self.log_test(
                    "Create Calendar Task", False, f"Status: {response.status_code}"
                )
        except Exception as e:
            self.log_test("Create Calendar Task", False, str(e))

        # Test 3: Update the created task (if it exists)
        if created_task_id:
            try:
                update_data = {"completed": True, "title": "Updated Test Task"}
                response = self.session.put(
                    f"{self.base_url}/calendar/items/{created_task_id}",
                    json=update_data,
                )
                if response.status_code == 200:
                    self.log_test(
                        "Update Calendar Task", True, "Task updated successfully"
                    )
                    tests_passed += 1
                else:
                    self.log_test(
                        "Update Calendar Task", False, f"Status: {response.status_code}"
                    )
            except Exception as e:
                self.log_test("Update Calendar Task", False, str(e))
        else:
            self.log_test("Update Calendar Task", False, "No task to update")

        # Test 4: Delete the created task (if it exists)
        if created_task_id:
            try:
                response = self.session.delete(
                    f"{self.base_url}/calendar/items/{created_task_id}"
                )
                if response.status_code == 200:
                    self.log_test(
                        "Delete Calendar Task", True, "Task deleted successfully"
                    )
                    tests_passed += 1
                else:
                    self.log_test(
                        "Delete Calendar Task", False, f"Status: {response.status_code}"
                    )
            except Exception as e:
                self.log_test("Delete Calendar Task", False, str(e))
        else:
            self.log_test("Delete Calendar Task", False, "No task to delete")

        return tests_passed == total_tests

    def test_goals_endpoints(self) -> bool:
        """Test goals CRUD operations"""
        tests_passed = 0
        total_tests = 3

        # Test 1: Get all goals
        try:
            response = self.session.get(f"{self.base_url}/goals")
            if response.status_code == 200:
                goals = response.json()
                self.log_test("Get Goals", True, f"Found {len(goals)} goals")
                tests_passed += 1
            else:
                self.log_test("Get Goals", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Goals", False, str(e))

        # Test 2: Create a goal
        goal_data = {
            "title": "Test Goal",
            "description": "API verification goal",
            "category": "personal",
            "priority": "medium",
            "target_date": (datetime.now() + timedelta(days=30)).isoformat(),
            "milestones": [
                {"title": "First milestone", "completed": False},
                {"title": "Second milestone", "completed": False},
            ],
        }

        created_goal_id = None
        try:
            response = self.session.post(f"{self.base_url}/goals", json=goal_data)
            if response.status_code == 200:
                created_goal = response.json()
                created_goal_id = created_goal.get("id")
                self.log_test(
                    "Create Goal", True, f"Created goal ID: {created_goal_id}"
                )
                tests_passed += 1
            else:
                self.log_test("Create Goal", False, f"Status: {response.status_code}")
                print(f"    Response: {response.text}")
        except Exception as e:
            self.log_test("Create Goal", False, str(e))

        # Test 3: Get the specific goal (if created)
        if created_goal_id:
            try:
                response = self.session.get(f"{self.base_url}/goals/{created_goal_id}")
                if response.status_code == 200:
                    goal = response.json()
                    milestone_count = len(goal.get("milestones", []))
                    self.log_test(
                        "Get Specific Goal",
                        True,
                        f"Goal has {milestone_count} milestones",
                    )
                    tests_passed += 1
                else:
                    self.log_test(
                        "Get Specific Goal", False, f"Status: {response.status_code}"
                    )
            except Exception as e:
                self.log_test("Get Specific Goal", False, str(e))
        else:
            self.log_test("Get Specific Goal", False, "No goal to retrieve")

        return tests_passed == total_tests

    def test_timer_endpoints(self) -> bool:
        """Test timer session endpoints"""
        tests_passed = 0
        total_tests = 3

        # Test 1: Get all timer sessions
        try:
            response = self.session.get(f"{self.base_url}/timer/sessions")
            if response.status_code == 200:
                sessions = response.json()
                self.log_test(
                    "Get Timer Sessions", True, f"Found {len(sessions)} sessions"
                )
                tests_passed += 1
            else:
                self.log_test(
                    "Get Timer Sessions", False, f"Status: {response.status_code}"
                )
        except Exception as e:
            self.log_test("Get Timer Sessions", False, str(e))

        # Test 2: Create a timer session
        session_data = {
            "title": "Test Focus Session",
            "category": "deep-work",
            "session_type": "pomodoro",
            "duration": 25,
            "start_time": datetime.now().isoformat(),
        }

        created_session_id = None
        try:
            response = self.session.post(
                f"{self.base_url}/timer/sessions", json=session_data
            )
            if response.status_code == 200:
                created_session = response.json()
                created_session_id = created_session.get("id")
                self.log_test(
                    "Create Timer Session",
                    True,
                    f"Created session ID: {created_session_id}",
                )
                tests_passed += 1
            else:
                self.log_test(
                    "Create Timer Session", False, f"Status: {response.status_code}"
                )
        except Exception as e:
            self.log_test("Create Timer Session", False, str(e))

        # Test 3: Complete the timer session (if created)
        if created_session_id:
            try:
                update_data = {
                    "end_time": datetime.now().isoformat(),
                    "completed": True,
                    "created_calendar_entry": True,
                }
                response = self.session.put(
                    f"{self.base_url}/timer/sessions/{created_session_id}",
                    json=update_data,
                )
                if response.status_code == 200:
                    self.log_test(
                        "Complete Timer Session",
                        True,
                        "Session completed and calendar entry created",
                    )
                    tests_passed += 1
                else:
                    self.log_test(
                        "Complete Timer Session",
                        False,
                        f"Status: {response.status_code}",
                    )
            except Exception as e:
                self.log_test("Complete Timer Session", False, str(e))
        else:
            self.log_test("Complete Timer Session", False, "No session to complete")

        return tests_passed == total_tests

    def test_analytics_endpoints(self) -> bool:
        """Test analytics endpoints"""
        try:
            response = self.session.get(f"{self.base_url}/analytics/productivity")
            if response.status_code == 200:
                analytics = response.json()
                self.log_test(
                    "Get Productivity Analytics",
                    True,
                    f"Tasks: {analytics.get('total_tasks', 0)}, "
                    f"Events: {analytics.get('total_events', 0)}",
                )
                return True
            else:
                self.log_test(
                    "Get Productivity Analytics",
                    False,
                    f"Status: {response.status_code}",
                )
                return False
        except Exception as e:
            self.log_test("Get Productivity Analytics", False, str(e))
            return False

    def test_preferences_endpoints(self) -> bool:
        """Test user preferences endpoints"""
        try:
            response = self.session.get(f"{self.base_url}/preferences")
            if response.status_code == 200:
                prefs = response.json()
                self.log_test(
                    "Get User Preferences",
                    True,
                    f"Default view: {prefs.get('default_calendar_view', 'unknown')}",
                )
                return True
            else:
                self.log_test(
                    "Get User Preferences", False, f"Status: {response.status_code}"
                )
                return False
        except Exception as e:
            self.log_test("Get User Preferences", False, str(e))
            return False

    def test_ai_endpoints(self) -> bool:
        """Test AI chat endpoints"""
        ai_request = {
            "question": "How am I doing with my productivity?",
            "include_context": ["tasks", "goals"],
        }

        try:
            response = self.session.post(f"{self.base_url}/ask", json=ai_request)
            if response.status_code == 200:
                ai_response = response.json()
                response_length = len(ai_response.get("response", ""))
                self.log_test(
                    "AI Chat", True, f"Response length: {response_length} characters"
                )
                return True
            else:
                self.log_test("AI Chat", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("AI Chat", False, str(e))
            return False

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all API tests"""
        print("🚀 SelfForge Backend API Verification")
        print("=" * 50)

        # Wait for server to be ready
        print("⏳ Waiting for server to be ready...")
        max_retries = 10
        for i in range(max_retries):
            try:
                response = self.session.get(f"{self.base_url}/health", timeout=5)
                if response.status_code == 200:
                    break
            except:
                if i == max_retries - 1:
                    print("❌ Server not responding after 10 attempts")
                    return {"success": False, "error": "Server not accessible"}
                time.sleep(1)

        # Run all tests
        results = {
            "health": self.test_health(),
            "calendar": self.test_calendar_endpoints(),
            "goals": self.test_goals_endpoints(),
            "timer": self.test_timer_endpoints(),
            "analytics": self.test_analytics_endpoints(),
            "preferences": self.test_preferences_endpoints(),
            "ai": self.test_ai_endpoints(),
        }

        # Summary
        print("\n" + "=" * 50)
        print("📊 Test Summary")
        print("=" * 50)

        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])

        for category, success in results.items():
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{status} {category.capitalize()} endpoints")

        print(f"\n🎯 Overall: {passed_tests}/{total_tests} tests passed")

        if passed_tests == total_tests:
            print("🎉 All tests passed! Backend is working correctly.")
        else:
            print("⚠️ Some tests failed. Check the logs above for details.")

        return {
            "success": passed_tests == total_tests,
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "results": results,
            "details": self.test_results,
        }


if __name__ == "__main__":
    verifier = APIVerifier()
    results = verifier.run_all_tests()

    # Exit with appropriate code
    exit(0 if results["success"] else 1)
