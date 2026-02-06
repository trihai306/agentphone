/**
 * Node Types Registry for Flow Editor
 * Maps node type strings to their corresponding React components
 */

// Custom node types
import CustomNode from '@/Components/Flow/CustomNode';
import InputNode from '@/Components/Flow/InputNode';
import OutputNode from '@/Components/Flow/OutputNode';
import ProcessNode from '@/Components/Flow/ProcessNode';

// Premium Glass nodes
import GlassLoopNode from '@/Components/Flow/GlassLoopNode';
import GlassDataSourceNode from '@/Components/Flow/GlassDataSourceNode';
import GlassConditionNode from '@/Components/Flow/GlassConditionNode';
import GlassTextInputNode from '@/Components/Flow/GlassTextInputNode';
import GlassHttpNode from '@/Components/Flow/GlassHttpNode';
import GlassAINode from '@/Components/Flow/GlassAINode';
import GlassWaitNode from '@/Components/Flow/GlassWaitNode';
import GlassAssertNode from '@/Components/Flow/GlassAssertNode';
import GlassElementCheckNode from '@/Components/Flow/GlassElementCheckNode';
import GlassWaitForElementNode from '@/Components/Flow/GlassWaitForElementNode';
import GlassProbabilityNode from '@/Components/Flow/GlassProbabilityNode';
import SmartActionNode from '@/Components/Flow/SmartActionNode';
import FileInputNode from '@/Components/Flow/FileInputNode';

export const nodeTypes = {
    // Control Flow
    custom: CustomNode,
    input: InputNode,
    output: OutputNode,
    process: ProcessNode,
    action: CustomNode,

    // Recorded Actions - Smart Professional Nodes
    recorded_action: SmartActionNode,
    smart_action: SmartActionNode,
    open_app: SmartActionNode,
    click: SmartActionNode,
    tap: SmartActionNode,
    long_tap: SmartActionNode,
    long_press: SmartActionNode,
    double_tap: SmartActionNode,
    text_input: SmartActionNode,
    scroll: SmartActionNode,
    scroll_up: SmartActionNode,
    scroll_down: SmartActionNode,
    scroll_left: SmartActionNode,
    scroll_right: SmartActionNode,
    swipe: SmartActionNode,
    swipe_left: SmartActionNode,
    swipe_right: SmartActionNode,
    swipe_up: SmartActionNode,
    swipe_down: SmartActionNode,
    key_event: SmartActionNode,
    repeat_click: SmartActionNode,
    focus: SmartActionNode,
    back: SmartActionNode,
    home: SmartActionNode,

    // Advanced Gestures
    drag_drop: SmartActionNode,
    pinch_zoom: SmartActionNode,
    fling: SmartActionNode,

    // System Actions
    recents: SmartActionNode,
    notifications: SmartActionNode,
    quick_settings: SmartActionNode,
    lock_screen: SmartActionNode,
    power_dialog: SmartActionNode,

    // Text Operations
    clear_text: SmartActionNode,
    get_text: SmartActionNode,
    append_text: SmartActionNode,
    select_all: SmartActionNode,

    // Element Inspection
    get_bounds: SmartActionNode,
    is_visible: SmartActionNode,
    count_elements: SmartActionNode,

    // Media Controls
    volume_up: SmartActionNode,
    volume_down: SmartActionNode,
    mute: SmartActionNode,
    media_play_pause: SmartActionNode,
    media_next: SmartActionNode,
    media_previous: SmartActionNode,

    // Wait Conditions
    wait_for_text: SmartActionNode,
    wait_for_activity: SmartActionNode,
    wait_for_package: SmartActionNode,
    wait_idle: SmartActionNode,

    // Logic/Conditions - Premium Glass versions
    condition: GlassConditionNode,
    probability: GlassProbabilityNode,
    loop: GlassLoopNode,
    loopStart: SmartActionNode,
    loopEnd: SmartActionNode,
    wait: GlassWaitNode,
    assert: GlassAssertNode,
    element_check: GlassElementCheckNode,
    wait_for_element: GlassWaitForElementNode,

    // Resources - Premium Glass versions
    file_input: FileInputNode,
    text_data: GlassTextInputNode,
    data_source: GlassDataSourceNode,
    ai_process: GlassAINode,
    ai_call: GlassAINode,
    http: GlassHttpNode,
};

export default nodeTypes;
