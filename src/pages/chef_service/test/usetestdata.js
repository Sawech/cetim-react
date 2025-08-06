import { useEffect } from "react";
import axios from "axios";
import { replaceVariables, replaceMathFunctions } from "./variableutils";

// usetestdata.js
const useTestData = (id, setItems, setVariables, setTestName, setTestCode) => {
  useEffect(() => {
    if (id === "0") {
      setItems([]); // Set as empty array instead of object
      setVariables([]); // Set as empty array instead of object
      setTestName("");
      setTestCode("");
      return;
    }
  }, [id, setItems, setTestName, setTestCode]);

  useEffect(() => {
    if (id === "0") return;

    const fetchTestData = async () => {
      try {
        const response = await axios.get(
          `https://cetim-spring.onrender.com/api/tests/${id}`
        );

        if (!response.data) {
          console.error("No data received from API");
          return;
        }

        setTestName(response.data.testName || "");
        setTestCode(response.data.testCode || "");

        // Process elements
        const elements = (response.data.elements || [])
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .map((element) => {
            if (!element) return null;

            switch (element.type) {
              case "sentence":
                return {
                  id: element.id,
                  type: "sentence",
                  text: element.content || "",
                  important: element.important || false,
                };
                case "title":
                return {
                  id: element.id,
                  type: "title",
                  text: element.content || "",
                  important: element.important || false,
                };
              case "image":
                return {
                  id: element.id,
                  type: "image",
                  text: element.content || "",
                  important: element.important || false,
                };
              case "table":
                return {
                  id: element.id,
                  type: "table",
                  tableContent: element.tableContent || "",
                  side: element.side || "",
                  important: element.important || false,
                };
              default:
                return null;
            }
          })
          .filter(Boolean);

        // Process variables
        const variables = (response.data.variables || []).map((variable) => ({
          ...variable,
          name: variable.name || "",
          expression: variable.expression || "",
          computedValue: variable.computedValue || 0,
          min: variable.min,
          max: variable.max,
          unit: variable.unit,
        }));

        // Compute variable values
        variables.forEach((item) => {
          if (item.expression && !/^\d*\.?\d+$/.test(item.expression)) {
            try {
              let substitutedExpression = replaceVariables(
                item.expression,
                variables
              );
              let evalExpression = replaceMathFunctions(substitutedExpression);
              item.computedValue = eval(evalExpression);
            } catch (error) {
              console.error(`Error recomputing variable ${item.name}:`, error);
              item.computedValue = 0;
            }
          }
        });

        // Combine elements and variables into a single array
        setVariables(variables);
        setItems(elements);
      } catch (err) {
        console.error("Error fetching test data:", err);
        setItems([]);
      }
    };

    fetchTestData();
  }, [id, setItems, setVariables, setTestName, setTestCode]);

  return { initialItems: [] };
};

export default useTestData;
