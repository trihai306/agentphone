"""
Smart Agent - Examples

Using Vision + Accessibility for automation
"""

import asyncio
import os
from dotenv import load_dotenv

load_dotenv()


async def example_1_simple():
    """Example 1: Simple usage"""
    print("\n" + "="*60)
    print("Example 1: Simple Usage")
    print("="*60)

    from agents import Agent

    # Create agent
    agent = Agent(device="emulator-5554", debug=True)

    # Run with natural language goal
    result = await agent.run(
        "Open Facebook app and navigate to Watch section"
    )

    print(f"\n{'OK' if result.success else 'FAIL'} {result.message}")
    print(f"Steps: {result.total_steps}")
    print(f"Time: {result.execution_time:.2f}s")


async def example_2_oneliner():
    """Example 2: One-liner"""
    print("\n" + "="*60)
    print("Example 2: One-liner")
    print("="*60)

    from agents import run

    result = await run("Open Settings and go to Wi-Fi")

    print(f"\n{'OK' if result.success else 'FAIL'} {result.message}")


async def example_3_device_tools():
    """Example 3: Direct device control"""
    print("\n" + "="*60)
    print("Example 3: Direct Device Control")
    print("="*60)

    from agents import DeviceTools

    # Create tools
    tools = DeviceTools(serial="emulator-5554")

    # Get current state
    state = tools.get_state()
    print(f"\nCurrent app: {state.phone_state.current_app}")
    print(f"Elements: {len(state.elements)}")

    # Find elements by text
    search_elements = tools.find_elements_by_text("Search")
    print(f"Found 'Search' elements: {len(search_elements)}")

    for elem in search_elements[:3]:
        print(f"  [{elem.index}] {elem.class_name} @ ({elem.center_x}, {elem.center_y})")

    # Take screenshot
    tools.save_screenshot("./screenshots/test_screenshot.png")
    print("\nScreenshot saved!")


async def example_4_smart_agent():
    """Example 4: Full SmartAgent with options"""
    print("\n" + "="*60)
    print("Example 4: SmartAgent with Options")
    print("="*60)

    from agents import SmartAgent

    # Create agent with options
    agent = SmartAgent(
        device_serial="emulator-5554",
        model="gpt-4o",
        debug=True
    )

    # Add memory
    agent.remember("target_videos", 3)
    agent.remember("like_videos", True)

    # Run
    result = await agent.run(
        goal="Open TikTok and watch 3 videos on FYP, like each one",
        max_steps=25
    )

    print(f"\n{'OK' if result.success else 'FAIL'} {result.message}")

    # Show step history
    print("\nStep History:")
    for step in result.steps[:5]:
        status = "OK" if step.success else "FAIL"
        print(f"  {status} Step {step.step}: {step.action.action_type} - {step.message}")


async def example_5_element_detection():
    """Example 5: UI Element Detection"""
    print("\n" + "="*60)
    print("Example 5: UI Element Detection")
    print("="*60)

    from agents import DeviceTools

    tools = DeviceTools(serial="emulator-5554")

    # Open an app first
    tools.start_app("com.android.settings")
    await asyncio.sleep(2)

    # Get state
    state = tools.get_state()

    # Print all elements
    print("\nUI Elements:")
    print(tools.format_state_for_llm())

    # Find clickable elements
    clickable = tools.find_clickable_elements()
    print(f"\nClickable elements: {len(clickable)}")

    # Find by text
    wifi = tools.find_elements_by_text("Wi-Fi")
    if wifi:
        print(f"\nWi-Fi element found at index {wifi[0].index}")
        print(f"  Position: ({wifi[0].center_x}, {wifi[0].center_y})")

        # Tap it
        tools.tap_element(wifi[0].index)
        print("  Tapped!")


async def example_6_shopee_search():
    """Example 6: Shopee Search"""
    print("\n" + "="*60)
    print("Example 6: Shopee Search")
    print("="*60)

    from agents import Agent

    agent = Agent(debug=True)

    result = await agent.run(
        "Open Shopee, search for 'iPhone 15 Pro Max', and show the first 3 products",
        max_steps=20
    )

    print(f"\n{'OK' if result.success else 'FAIL'} {result.message}")


async def main():
    """Run examples"""
    print("\n" + "="*60)
    print("SMART AGENT - EXAMPLES")
    print("Vision + Accessibility Based Agent")
    print("="*60)

    examples = [
        ("1. Simple Usage", example_1_simple),
        ("2. One-liner", example_2_oneliner),
        ("3. Device Tools", example_3_device_tools),
        ("4. SmartAgent Options", example_4_smart_agent),
        ("5. Element Detection", example_5_element_detection),
        ("6. Shopee Search", example_6_shopee_search),
    ]

    print("\nAvailable examples:")
    for name, _ in examples:
        print(f"  {name}")

    choice = input("\nChoose example (1-6) or 'all': ").strip()

    if choice == "all":
        for name, func in examples:
            try:
                await func()
                await asyncio.sleep(2)
            except Exception as e:
                print(f"Error: {e}")
    elif choice.isdigit() and 1 <= int(choice) <= len(examples):
        _, func = examples[int(choice) - 1]
        await func()
    else:
        print("Invalid choice")


if __name__ == "__main__":
    asyncio.run(main())
