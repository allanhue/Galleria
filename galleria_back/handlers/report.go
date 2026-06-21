package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateReport(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input struct {
		TargetType string `json:"target_type" binding:"required"`
		TargetID   uint   `json:"target_id"   binding:"required"`
		Reason     string `json:"reason"      binding:"required"`
		Details    string `json:"details"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	report := models.Report{
		ReporterID: userID.(uint),
		TargetType: input.TargetType,
		TargetID:   input.TargetID,
		Reason:     input.Reason,
		Details:    input.Details,
	}
	db.DB.Create(&report)

	c.JSON(http.StatusCreated, gin.H{"message": "Report submitted, our team will review it"})
}

// Admin-only — simple queue, no auth tiering yet beyond role check
func GetReports(c *gin.Context) {
	role, _ := c.Get("role")
	if role != "system_admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin only"})
		return
	}

	reports := []models.Report{}
	db.DB.Preload("Reporter").Order("created_at desc").Find(&reports)
	c.JSON(http.StatusOK, reports)
}

func UpdateReportStatus(c *gin.Context) {
	role, _ := c.Get("role")
	if role != "system_admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin only"})
		return
	}

	id := c.Param("id")
	var input struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db.DB.Model(&models.Report{}).Where("id = ?", id).Update("status", input.Status)
	c.JSON(http.StatusOK, gin.H{"message": "Updated"})
}