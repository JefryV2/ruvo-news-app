import { Platform, Alert } from 'react-native';

export const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    // For web, use the browser's alert/prompt functions
    window.alert(`${title}: ${message}`);
  } else {
    // For mobile, use React Native's Alert
    Alert.alert(title, message);
  }
};

export const showPrompt = (title: string, message: string, options: { text: string; onPress?: () => void }[]) => {
  if (Platform.OS === 'web') {
    // For web, create a simple prompt with numbered options
    const optionText = options
      .filter(option => option.text !== 'Cancel') // Exclude cancel option
      .map((option, index) => `${index + 1}. ${option.text}`)
      .join('\n');
    
    const promptMessage = `${title}
${message}

${optionText}

Enter your choice (1-${options.length - 1}) or cancel:`;
    const choice = window.prompt(promptMessage);
    
    if (choice) {
      const choiceIndex = parseInt(choice);
      if (choiceIndex >= 1 && choiceIndex <= options.length - 1) {
        const selectedOption = options[choiceIndex];
        if (selectedOption && selectedOption.onPress) {
          selectedOption.onPress();
        }
      }
    }
  } else {
    // For mobile, use React Native's Alert
    Alert.alert(title, message, options as any);
  }
};