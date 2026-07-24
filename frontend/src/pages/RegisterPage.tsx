import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "../components/layout/PageContainer";
import { OperationForm } from "../components/operations/OperationForm";
import { OperationConfirmation } from "../components/operations/OperationConfirmation";
import { OperationSuccess } from "../components/operations/OperationSuccess";
import { useApp } from "../context/AppContext";
import type { InterpretedOperation } from "../types/operation";

type Stage = "form" | "confirm" | "success";

export function RegisterPage() {
  const navigate = useNavigate();
  const { applyConfirmedOperation, setLastResult } = useApp();
  const [stage, setStage] = useState<Stage>("form");
  const [operation, setOperation] = useState<InterpretedOperation | null>(null);

  const handleInterpreted = (op: InterpretedOperation) => {
    setOperation(op);
    setStage("confirm");
  };

  const handleCancel = () => {
    setOperation(null);
    setStage("form");
  };

  const handleConfirm = (op: InterpretedOperation) => {
    applyConfirmedOperation(op);
    setStage("success");
  };

  const handleRegisterAnother = () => {
    setLastResult(null);
    setOperation(null);
    setStage("form");
  };

  return (
    <PageContainer>
      {stage === "form" ? (
        <OperationForm onInterpreted={handleInterpreted} />
      ) : stage === "confirm" && operation ? (
        <OperationConfirmation
          operation={operation}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
      ) : (
        <OperationSuccess
          onRegisterAnother={handleRegisterAnother}
          onGoHome={() => navigate("/")}
        />
      )}
    </PageContainer>
  );
}
